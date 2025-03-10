import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, useProgress, Html, FlyControls } from '@react-three/drei';
import SkyGallery from './components/SkyGallery';
import Timeline from './components/Timeline';
import { GlassNavigation } from './components/glass-navigation';
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
  const [totalDays] = useState(364);
  const [autoplay, setAutoplay] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(1000); // ms between days
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [cameraMode, setCameraMode] = useState('orbit'); // 'orbit' or 'fly'
  const [viewMode, setViewMode] = useState('3d'); // '3d' or '2d'
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState('day'); // 'day', 'sunset', 'night', 'sunrise'
  
  // Audio refs
  const ambientSoundRef = useRef(null);
  const transitionSoundRef = useRef(null);
  const uiClickSoundRef = useRef(null);
  
  // Autoplay interval ref
  const autoplayIntervalRef = useRef(null);
  
  // Load audio elements
  useEffect(() => {
    ambientSoundRef.current = document.getElementById('ambient-sound');
    transitionSoundRef.current = document.getElementById('transition-sound');
    uiClickSoundRef.current = document.getElementById('ui-click-sound');
    
    // Add error handlers
    if (ambientSoundRef.current) {
      ambientSoundRef.current.addEventListener('error', handleAudioError);
    }
    if (transitionSoundRef.current) {
      transitionSoundRef.current.addEventListener('error', handleAudioError);
    }
    if (uiClickSoundRef.current) {
      uiClickSoundRef.current.addEventListener('error', handleAudioError);
    }
    
    // Cleanup
    return () => {
      if (ambientSoundRef.current) {
        ambientSoundRef.current.removeEventListener('error', handleAudioError);
      }
      if (transitionSoundRef.current) {
        transitionSoundRef.current.removeEventListener('error', handleAudioError);
      }
      if (uiClickSoundRef.current) {
        uiClickSoundRef.current.removeEventListener('error', handleAudioError);
      }
    };
  }, []);
  
  // Handle loading state
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle autoplay
  useEffect(() => {
    if (autoplay) {
      autoplayIntervalRef.current = setInterval(() => {
        setCurrentDay(prev => (prev + 1) % totalDays);
      }, autoplaySpeed);
    } else {
      clearInterval(autoplayIntervalRef.current);
    }
    
    return () => clearInterval(autoplayIntervalRef.current);
  }, [autoplay, autoplaySpeed, totalDays]);
  
  // Handle ambient sound
  useEffect(() => {
    if (ambientSoundRef.current) {
      if (soundEnabled) {
        ambientSoundRef.current.play().catch(e => console.warn("Audio play failed:", e));
      } else {
        ambientSoundRef.current.pause();
      }
    }
  }, [soundEnabled]);
  
  // Error handler for audio
  const handleAudioError = (e) => {
    console.error("Audio loading failed: ", e);
  };
  
  // Determine time of day based on current day
  const determineTimeOfDay = (day) => {
    // Simplified logic - in a real app, this would be more sophisticated
    const hour = (day * 24) % 24;
    
    if (hour >= 6 && hour < 10) return 'sunrise';
    if (hour >= 10 && hour < 18) return 'day';
    if (hour >= 18 && hour < 22) return 'sunset';
    return 'night';
  };
  
  // Update time of day when current day changes
  useEffect(() => {
    setTimeOfDay(determineTimeOfDay(currentDay));
  }, [currentDay]);
  
  const handleDayChange = (direction) => {
    if (direction === 'prev' || direction === -1) {
      setCurrentDay((prev) => (prev - 1 + totalDays) % totalDays);
    } else if (direction === 'next' || direction === 1) {
      setCurrentDay((prev) => (prev + 1) % totalDays);
    } else if (typeof direction === 'number') {
      // Pokud je direction číslo, ale není 1 ani -1, považujeme ho za konkrétní den
      setCurrentDay(Math.max(0, Math.min(totalDays - 1, direction)));
    }
    
    // Play transition sound if enabled
    if (soundEnabled && transitionSoundRef.current) {
      try {
        transitionSoundRef.current.currentTime = 0;
        transitionSoundRef.current.play()
          .catch(e => console.warn("Audio play failed:", e));
      } catch (error) {
        console.warn("Error playing transition sound:", error);
      }
    }
    
    if (autoplay) setAutoplay(false);
  };

  const toggleAutoplay = () => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      try {
        uiClickSoundRef.current.currentTime = 0;
        uiClickSoundRef.current.play()
          .catch(e => console.warn("Audio play failed:", e));
      } catch (error) {
        console.warn("Error playing UI click sound:", error);
      }
    }
    
    setAutoplay(prev => !prev);
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
    
    // Play UI click sound if turning sound on
    if (!soundEnabled && uiClickSoundRef.current) {
      try {
        uiClickSoundRef.current.currentTime = 0;
        uiClickSoundRef.current.play()
          .catch(e => console.warn("Audio play failed:", e));
      } catch (error) {
        console.warn("Error playing UI click sound:", error);
      }
    }
  };

  const toggleCameraMode = () => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      try {
        uiClickSoundRef.current.currentTime = 0;
        uiClickSoundRef.current.play()
          .catch(e => console.warn("Audio play failed:", e));
      } catch (error) {
        console.warn("Error playing UI click sound:", error);
      }
    }
    
    setCameraMode(prev => prev === 'orbit' ? 'fly' : 'orbit');
  };

  const toggleInfo = () => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      try {
        uiClickSoundRef.current.currentTime = 0;
        uiClickSoundRef.current.play()
          .catch(e => console.warn("Audio play failed:", e));
      } catch (error) {
        console.warn("Error playing UI click sound:", error);
      }
    }
    
    setShowInfo(prev => !prev);
  };

  const changeAutoplaySpeed = (speed) => {
    setAutoplaySpeed(speed);
  };

  // Toggle between 2D and 3D view modes
  const toggleViewMode = () => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      try {
        uiClickSoundRef.current.currentTime = 0;
        uiClickSoundRef.current.play()
          .catch(e => console.warn("Audio play failed:", e));
      } catch (error) {
        console.warn("Error playing UI click sound:", error);
      }
    }
    
    // Bezpečnější přepínání režimů s resetováním kamery
    setViewMode(prev => {
      const newMode = prev === '3d' ? '2d' : '3d';
      console.log("Přepínám režim z", prev, "na", newMode);
      
      // Resetujeme kameru při změně režimu
      setTimeout(() => {
        const camera = document.querySelector('canvas')?._reactInternals?.canonical?.stateNode?.__r3f?.camera;
        if (camera) {
          if (newMode === '2d') {
            // Pro 2D režim nastavíme kameru do pozice před rovinou
            camera.position.set(0, 0, 10);
            camera.lookAt(0, 0, -1);
            camera.updateProjectionMatrix();
          } else {
            // Pro 3D režim nastavíme kameru dovnitř koule
            camera.position.set(0, 0, 0);
            camera.lookAt(1, 0, 0); // Podíváme se na nějaký bod uvnitř koule
            camera.updateProjectionMatrix();
          }
        }
      }, 50);
      
      return newMode;
    });
  };

  // Bezpečné renderování OrbitControls/FlyControls
  const renderControls = () => {
    // Použijeme key prop pro vynucení nové instance kontrolů při změně režimu
    const controlKey = `controls-${viewMode}-${cameraMode}`;
    
    try {
      // V 2D režimu použijeme omezené OrbitControls
      if (viewMode === '2d') {
        return (
          <OrbitControls 
            key={controlKey}
            makeDefault
            enableZoom={true} 
            enablePan={true}
            maxDistance={20}
            minDistance={5}
            // Omezíme rotaci, aby obrázek zůstal víceméně rovně
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2 + Math.PI / 4}
            target={[0, 0, -1]}
            rotateSpeed={0.5}
          />
        );
      }
      
      // Kontroly pro 3D režim
      if (cameraMode === 'orbit') {
        return (
          <OrbitControls 
            key={controlKey}
            makeDefault
            enableZoom={true} 
            enablePan={false}
            maxDistance={10}
            minDistance={0.1}
            minPolarAngle={0} 
            maxPolarAngle={Math.PI}
            target={[0, 0, 0]}
            rotateSpeed={0.5}
          />
        );
      } else {
        return (
          <FlyControls 
            key={controlKey}
            makeDefault
            movementSpeed={2}
            rollSpeed={0.2}
            dragToLook={true}
          />
        );
      }
    } catch (error) {
      console.error("Error rendering controls:", error);
      // Fallback na základní OrbitControls v případě chyby
      return (
        <OrbitControls 
          key="fallback-controls"
          makeDefault
          enableZoom={true} 
          enablePan={false}
          target={[0, 0, 0]}
        />
      );
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

  // Funkce pro změnu sezóny
  const handleSeasonChange = (seasonId) => {
    // Přepočítáme den podle sezóny
    const seasonRanges = {
      1: { start: 1, end: 91 }, // Jaro
      2: { start: 92, end: 183 }, // Léto
      3: { start: 184, end: 274 }, // Podzim
      4: { start: 275, end: 364 }, // Zima
    };
    
    const range = seasonRanges[seasonId];
    if (range) {
      // Nastavíme den na střed sezóny
      const middleDay = Math.floor((range.start + range.end) / 2);
      setCurrentDay(middleDay);
    }
  };

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Canvas 
          camera={{ 
            position: viewMode === '2d' ? [0, 0, 10] : [0, 0, 0], 
            fov: viewMode === '2d' ? 40 : 75, 
            near: 0.1, 
            far: 1000,
            // Nastavíme lookAt pro 2D režim
            ...(viewMode === '2d' ? { lookAt: [0, 0, -1] } : {})
          }}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            precision: "highp"
          }}
          dpr={[1, 2]} // Responsive pixel ratio
        >
          <Suspense fallback={<Loader />}>
            <SkyGallery currentDay={currentDay} totalDays={totalDays} viewMode={viewMode} />
            {renderControls()}
          </Suspense>
        </Canvas>
      </div>
      
      {/* Nová GlassNavigation komponenta */}
      <GlassNavigation 
        currentDay={currentDay + 1}
        totalDays={totalDays}
        onPlay={toggleAutoplay}
        onPause={toggleAutoplay}
        onPrevious={() => handleDayChange(-1)}
        onNext={() => handleDayChange(1)}
        onSoundToggle={toggleSound}
        onToggleViewMode={toggleViewMode}
        onInfo={toggleInfo}
        onSeasonChange={handleSeasonChange}
      />
      
      <div className={`info-panel ${showInfo ? 'visible' : ''}`}>
        <div className="info-title">DNES OBLOHA NEVYPADALA STEJNĚ</div>
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
          <button 
            className="close-info-button" 
            onClick={toggleInfo}
            aria-label="Zavřít informační panel"
          >
            ZAVŘÍT
          </button>
        </div>
      </div>
      
      {/* Audio elements */}
      <audio id="ambient-sound" loop preload="auto">
        <source src={`${import.meta.env.BASE_URL || '/'}sounds/ambient.mp3`} type="audio/mp3" />
      </audio>
      <audio id="transition-sound" preload="auto">
        <source src={`${import.meta.env.BASE_URL || '/'}sounds/transition.mp3`} type="audio/mp3" />
      </audio>
      <audio id="ui-click-sound" preload="auto">
        <source src={`${import.meta.env.BASE_URL || '/'}sounds/click.mp3`} type="audio/mp3" />
      </audio>
    </div>
  );
}

export default App; 