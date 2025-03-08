import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, useProgress, Html, FlyControls } from '@react-three/drei';
import SkyGallery from './components/SkyGallery';
import Timeline from './components/Timeline';
import { gsap } from 'gsap';
import './styles.css';

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
  const totalDays = 364;
  
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

  const handleDayChange = (day) => {
    // Only change if it's a different day
    if (day !== currentDay) {
      // Use GSAP for smooth state transition
      gsap.to({}, {
        duration: 0.5,
        onComplete: () => {
          setCurrentDay(day);
          
          // Play transition sound if enabled, but only if it's a user-initiated change
          if (soundEnabled && transitionSoundRef.current && !autoplay) {
            transitionSoundRef.current.currentTime = 0;
            transitionSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
          }
        }
      });
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
    
    setViewMode(prev => prev === '3d' ? '2d' : '3d');
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
      <div className="canvas-container" style={{ display: viewMode === '3d' ? 'block' : 'none' }}>
        <Canvas camera={{ position: [0, 0, 0], fov: 75, up: [0, 0, 1] }}>
          <Suspense fallback={<Loader />}>
            <SkyGallery currentDay={currentDay} totalDays={totalDays} />
            {cameraMode === 'orbit' ? (
              <OrbitControls 
                enableZoom={true} 
                enablePan={true}
                maxDistance={10}
                minDistance={0.1}
                // Omezit rotaci, aby byl pohled vždy nahoru
                minPolarAngle={Math.PI / 2 - 0.2} // Omezit pohled dolů
                maxPolarAngle={Math.PI / 2 + 0.2} // Omezit pohled nahoru
              />
            ) : (
              <FlyControls 
                movementSpeed={5}
                rollSpeed={0.5}
                dragToLook={true}
              />
            )}
          </Suspense>
        </Canvas>
      </div>
      
      {/* 2D zobrazení - jednoduchý obrázek na celou obrazovku */}
      <div className="fullscreen-image" style={{ display: viewMode === '2d' ? 'block' : 'none' }}>
        <img 
          src={`/images/day_${(currentDay % 8) + 1}.JPG`} 
          alt={`Den ${currentDay + 1}`} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            zIndex: 0 
          }}
        />
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
            Projekt využívá React Three Fiber pro vytvoření imerzivního 3D prostředí, kde jsou obrázky 
            prezentovány jako textura na sféře obklopující pozorovatele.
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