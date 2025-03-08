import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useProgress, Html, FlyControls } from '@react-three/drei';
import SkyGallery from './components/SkyGallery';
import Timeline from './components/Timeline';
import { gsap } from 'gsap';
import './styles.css';

// Komponenta pro získání reference na kameru
function CameraController({ cameraRef }) {
  const { camera } = useThree();
  
  useEffect(() => {
    if (cameraRef) {
      cameraRef.current = camera;
    }
  }, [camera, cameraRef]);
  
  return null;
}

// Loader component
function Loader() {
  const { progress } = useProgress();
  const progressRef = useRef(null);
  
  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${progress}%`,
        duration: 0.5,
        ease: "power1.out"
      });
    }
  }, [progress]);
  
  return (
    <Html center>
      <div className="loader">
        <div className="loader-spinner"></div>
        <div className="loader-text">NAČÍTÁNÍ VOLUMETRICKÝCH OBLOH</div>
        <div className="loader-progress-container">
          <div className="loader-progress" ref={progressRef}></div>
        </div>
        <div className="loader-percentage">{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
}

function App() {
  const [currentDay, setCurrentDay] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(5000); // ms between days - default slower
  const [showInfo, setShowInfo] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [cameraMode, setCameraMode] = useState('orbit'); // 'orbit' or 'fly'
  const [viewMode, setViewMode] = useState('3d'); // '3d' or '2d'
  const [timeOfDay, setTimeOfDay] = useState('den'); // 'den' or 'noc'
  const totalDays = 364;
  
  // Reference na kameru pro animace
  const cameraRef = useRef();
  
  // Audio references
  const ambientSoundRef = useRef(null);
  const transitionSoundRef = useRef(null);
  const uiClickSoundRef = useRef(null);
  
  // Initialize sounds
  useEffect(() => {
    // Create ambient background sound
    const ambientSound = new Audio('/sounds/ambient.mp3');
    ambientSound.loop = true;
    ambientSound.volume = 0.3;
    ambientSoundRef.current = ambientSound;
    
    // Create transition sound
    const transitionSound = new Audio('/sounds/transition.mp3');
    transitionSound.volume = 0.5;
    transitionSoundRef.current = transitionSound;
    
    // Create UI click sound
    const uiClickSound = new Audio('/sounds/click.mp3');
    uiClickSound.volume = 0.2;
    uiClickSoundRef.current = uiClickSound;
    
    // Cleanup on unmount
    return () => {
      if (ambientSoundRef.current) {
        ambientSoundRef.current.pause();
      }
    };
  }, []);
  
  // Toggle sound
  useEffect(() => {
    if (soundEnabled && ambientSoundRef.current) {
      ambientSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
    } else if (ambientSoundRef.current) {
      ambientSoundRef.current.pause();
    }
  }, [soundEnabled]);

  // Handle autoplay functionality
  useEffect(() => {
    let interval;
    if (autoplay) {
      interval = setInterval(() => {
        setCurrentDay((prev) => {
          const nextDay = (prev + 1) % totalDays;
          // Play transition sound if enabled
          if (soundEnabled && transitionSoundRef.current) {
            transitionSoundRef.current.currentTime = 0;
            transitionSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
          }
          return nextDay;
        });
      }, autoplaySpeed);
    }
    return () => clearInterval(interval);
  }, [autoplay, totalDays, autoplaySpeed, soundEnabled]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Funkce pro určení denní doby podle dne v roce
  const determineTimeOfDay = (day) => {
    // Jednoduchá simulace - polovina roku je den, polovina noc
    // V reálné aplikaci by toto bylo složitější podle skutečné astronomické pozice
    if (day < totalDays / 2) {
      setTimeOfDay('den');
    } else {
      setTimeOfDay('noc');
    }
  };
  
  // Aktualizace denní doby při změně dne
  useEffect(() => {
    determineTimeOfDay(currentDay);
  }, [currentDay]);

  const handleDayChange = (day) => {
    // Only change if it's a different day
    if (day !== currentDay) {
      setCurrentDay(day);
      
      // Play transition sound if enabled, but only if it's a user-initiated change
      if (soundEnabled && transitionSoundRef.current && !autoplay) {
        transitionSoundRef.current.currentTime = 0;
        transitionSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
      }
    }
    
    if (autoplay) setAutoplay(false);
  };

  const toggleAutoplay = () => {
    // Play UI click sound
    if (uiClickSoundRef.current) {
      uiClickSoundRef.current.currentTime = 0;
      uiClickSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    setAutoplay(!autoplay);
  };
  
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    
    // Play UI click sound if enabling sound
    if (!soundEnabled && uiClickSoundRef.current) {
      uiClickSoundRef.current.currentTime = 0;
      uiClickSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };
  
  const toggleCameraMode = () => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      uiClickSoundRef.current.currentTime = 0;
      uiClickSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    setCameraMode(prev => prev === 'orbit' ? 'fly' : 'orbit');
  };
  
  const toggleInfo = () => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      uiClickSoundRef.current.currentTime = 0;
      uiClickSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    setShowInfo(!showInfo);
  };
  
  const changeAutoplaySpeed = (speed) => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      uiClickSoundRef.current.currentTime = 0;
      uiClickSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    setAutoplaySpeed(speed);
  };

  const toggleViewMode = () => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      uiClickSoundRef.current.currentTime = 0;
      uiClickSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    // Plynulý přechod mezi 2D a 3D režimem
    if (viewMode === '3d') {
      // Přechod z 3D do 2D - nastavíme kameru přímo před obrázek
      gsap.to(cameraRef.current.position, {
        duration: 1.0,
        x: 0,
        y: 0,
        z: 8,
        ease: "power2.inOut",
        onComplete: () => {
          setViewMode('2d');
        }
      });
    } else {
      // Přechod z 2D do 3D - vrátíme kameru do původní pozice
      gsap.to(cameraRef.current.position, {
        duration: 1.0,
        x: 0,
        y: 0,
        z: 5,
        ease: "power2.inOut",
        onComplete: () => {
          setViewMode('3d');
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader">
          <div className="loader-spinner"></div>
          <div className="loader-text">NAČÍTÁNÍ VOLUMETRICKÝCH OBLOH</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Canvas 
          camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 1000 }}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            precision: "highp"
          }}
        >
          <Suspense fallback={<Loader />}>
            <SkyGallery currentDay={currentDay} totalDays={totalDays} />
            {viewMode === '3d' ? (
              cameraMode === 'orbit' ? (
                <OrbitControls 
                  enableZoom={true} 
                  enablePan={false}
                  maxDistance={10}
                  minDistance={3}
                  // Nastavení pro lepší pohled na oblohu
                  minPolarAngle={Math.PI / 4} 
                  maxPolarAngle={Math.PI * 3/4}
                  // Výchozí rotace kamery - pohled na oblohu
                  target={[0, 0, 0]}
                />
              ) : (
                <FlyControls 
                  movementSpeed={3}
                  rollSpeed={0.3}
                  dragToLook={true}
                />
              )
            ) : (
              // 2D režim - fixní kamera přímo před obrázkem
              <OrbitControls 
                enableZoom={false} 
                enablePan={false}
                enableRotate={false}
                minDistance={8}
                maxDistance={8}
                target={[0, 0, 0]}
              />
            )}
            <CameraController cameraRef={cameraRef} />
          </Suspense>
        </Canvas>
      </div>
      
      <div className="counter">DEN {currentDay + 1} / {totalDays}</div>
      
      <Timeline 
        currentDay={currentDay} 
        totalDays={totalDays} 
        onDayChange={handleDayChange} 
      />
      
      <div className="controls">
        <button 
          className={`control-button ${autoplay ? 'active' : ''}`} 
          onClick={toggleAutoplay}
        >
          {autoplay ? "ZASTAVIT" : "PŘEHRÁT"}
        </button>
        
        <button 
          className={`control-button ${soundEnabled ? 'active' : ''}`} 
          onClick={toggleSound}
        >
          {soundEnabled ? "ZVUK: ZAP" : "ZVUK: VYP"}
        </button>
        
        <button 
          className="control-button" 
          onClick={toggleCameraMode}
        >
          {cameraMode === 'orbit' ? "KAMERA: ORBIT" : "KAMERA: LET"}
        </button>
        
        <button 
          className={`control-button ${viewMode === '2d' ? 'active' : ''}`}
          onClick={toggleViewMode}
        >
          {viewMode === '3d' ? "ZOBRAZENÍ: 3D" : "ZOBRAZENÍ: 2D"}
        </button>
        
        <button 
          className="control-button" 
          onClick={toggleInfo}
        >
          INFO
        </button>
      </div>
      
      <div className="speed-controls">
        <button 
          className={`speed-button ${autoplaySpeed === 2000 ? 'active' : ''}`} 
          onClick={() => changeAutoplaySpeed(2000)}
        >
          RYCHLE
        </button>
        <button 
          className={`speed-button ${autoplaySpeed === 5000 ? 'active' : ''}`} 
          onClick={() => changeAutoplaySpeed(5000)}
        >
          STŘEDNÍ
        </button>
        <button 
          className={`speed-button ${autoplaySpeed === 10000 ? 'active' : ''}`} 
          onClick={() => changeAutoplaySpeed(10000)}
        >
          POMALU
        </button>
      </div>
      
      <button 
        className="info-button" 
        onClick={toggleInfo}
      >
        <span className="info-icon">i</span>
      </button>
      
      <div className={`info-panel ${showInfo ? 'visible' : ''}`}>
        <div className="info-title">364 — ARCHIV OBLOH</div>
        <div className="info-content">
          <p>
            Tato umělecká instalace zobrazuje 364 obrázků oblohy kreslených každý den v průběhu roku.
          </p>
          <p>
            Použijte časovou osu ve spodní části obrazovky pro navigaci mezi dny. Tlačítko "PŘEHRÁT" 
            spustí automatické procházení obrázků. Rychlost přehrávání můžete změnit pomocí tlačítek 
            v levém dolním rohu.
          </p>
          <p>
            Pomocí myši můžete otáčet pohledem v 3D prostoru. Přepínání mezi režimy kamery vám umožní 
            buď orbitální pohyb kolem středu (ORBIT) nebo volný pohyb v prostoru (LET).
          </p>
          <p>
            Aplikace nyní simuluje přirozený přechod mezi dnem a nocí podle pozice slunce. V noci se 
            objeví hvězdy a obloha ztmavne, zatímco během dne uvidíte jasnou modrou oblohu. Tento 
            cyklus se mění v závislosti na vybraném dni v roce.
          </p>
          <p>
            Projekt využívá React Three Fiber pro vytvoření imerzivního 3D prostředí, kde jsou obrázky 
            prezentovány jako textura na sféře obklopující pozorovatele, což vytváří dojem, že ležíte 
            na trávě a díváte se na oblohu nad vámi.
          </p>
        </div>
      </div>
      
      {/* Audio elements */}
      <audio id="ambient-sound" loop preload="auto">
        <source src="/sounds/ambient.mp3" type="audio/mp3" />
      </audio>
      <audio id="transition-sound" preload="auto">
        <source src="/sounds/transition.mp3" type="audio/mp3" />
      </audio>
      <audio id="ui-click-sound" preload="auto">
        <source src="/sounds/click.mp3" type="audio/mp3" />
      </audio>
    </div>
  );
}

export default App; 