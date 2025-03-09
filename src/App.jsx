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

// Modern floating control bar component
function FloatingControlBar({ 
  currentDay, 
  totalDays, 
  autoplay, 
  soundEnabled, 
  cameraMode, 
  viewMode,
  onDayChange,
  onToggleAutoplay,
  onToggleSound,
  onToggleCameraMode,
  onToggleViewMode,
  onShowInfo
}) {
  return (
    <div className="floating-control-bar">
      <div className="control-bar-content">
        <div className="day-counter">DEN {currentDay + 1} / {totalDays}</div>
        
        <div className="control-buttons">
          <button 
            className={`control-btn ${autoplay ? 'active' : ''}`}
            onClick={onToggleAutoplay}
          >
            {autoplay ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            )}
            <span>{autoplay ? "ZASTAVIT" : "PŘEHRÁT"}</span>
          </button>
          
          <button 
            className="control-btn"
            onClick={() => onDayChange('prev')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>PŘEDCHOZÍ</span>
          </button>
          
          <button 
            className="control-btn"
            onClick={() => onDayChange('next')}
          >
            <span>DALŠÍ</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
          
          <button 
            className={`control-btn ${viewMode === '2d' ? 'active' : ''}`}
            onClick={onToggleViewMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            <span>{viewMode === '3d' ? "2D" : "3D"}</span>
          </button>
          
          <button 
            className={`control-btn ${soundEnabled ? 'active' : ''}`}
            onClick={onToggleSound}
          >
            {soundEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
            )}
            <span>{soundEnabled ? "ZVUK: ZAP" : "ZVUK: VYP"}</span>
          </button>
          
          <button 
            className="control-btn info-btn"
            onClick={onShowInfo}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>INFO</span>
          </button>
        </div>
      </div>
    </div>
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
  
  // Audio references
  const ambientSoundRef = useRef(null);
  const transitionSoundRef = useRef(null);
  const uiClickSoundRef = useRef(null);
  
  // Initialize sounds
  useEffect(() => {
    // Get base URL for GitHub Pages
    const baseUrl = import.meta.env.BASE_URL || '/';
    
    // Create ambient background sound
    const ambientSound = new Audio(`${baseUrl}sounds/ambient.mp3`);
    ambientSound.loop = true;
    ambientSound.volume = 0.3;
    ambientSoundRef.current = ambientSound;
    
    // Create transition sound
    const transitionSound = new Audio(`${baseUrl}sounds/transition.mp3`);
    transitionSound.volume = 0.5;
    transitionSoundRef.current = transitionSound;
    
    // Create UI click sound
    const uiClickSound = new Audio(`${baseUrl}sounds/click.mp3`);
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

  const handleDayChange = (direction) => {
    if (direction === 'prev') {
      setCurrentDay((prev) => (prev - 1 + totalDays) % totalDays);
    } else if (direction === 'next') {
      setCurrentDay((prev) => (prev + 1) % totalDays);
    } else if (typeof direction === 'number') {
      setCurrentDay(direction);
    }
    
    // Play transition sound if enabled
    if (soundEnabled && transitionSoundRef.current) {
      transitionSoundRef.current.currentTime = 0;
      transitionSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
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
  
  // Toggle info panel
  const toggleInfo = () => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      uiClickSoundRef.current.currentTime = 0;
      uiClickSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    // Toggle info panel visibility
    setShowInfo(prev => !prev);
  };
  
  const changeAutoplaySpeed = (speed) => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      uiClickSoundRef.current.currentTime = 0;
      uiClickSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    setAutoplaySpeed(speed);
  };

  // Toggle between 2D and 3D view modes
  const toggleViewMode = () => {
    // Play UI click sound
    if (soundEnabled && uiClickSoundRef.current) {
      uiClickSoundRef.current.currentTime = 0;
      uiClickSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    // Toggle view mode
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
      <div className="canvas-container">
        <Canvas 
          camera={{ position: [0, 0, 0], fov: 75, near: 0.1, far: 1000 }}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            precision: "highp"
          }}
          dpr={[1, 2]} // Responsive pixel ratio
        >
          <Suspense fallback={<Loader />}>
            <SkyGallery currentDay={currentDay} totalDays={totalDays} />
            {viewMode === '3d' ? (
              cameraMode === 'orbit' ? (
                <OrbitControls 
                  enableZoom={true} 
                  enablePan={false}
                  maxDistance={10}
                  minDistance={0.1}
                  // Nastavení pro lepší pohled na oblohu
                  minPolarAngle={0} 
                  maxPolarAngle={Math.PI}
                  // Výchozí rotace kamery - pohled na oblohu
                  target={[0, 0, 0]}
                  rotateSpeed={0.5} // Pomalejší rotace pro lepší kontrolu
                />
              ) : (
                <FlyControls 
                  movementSpeed={2}
                  rollSpeed={0.2}
                  dragToLook={true}
                />
              )
            ) : (
              // 2D režim - fixní kamera s omezeným pohybem
              <OrbitControls 
                enableZoom={false} 
                enablePan={false}
                enableRotate={true}
                minPolarAngle={Math.PI / 2 - 0.1} 
                maxPolarAngle={Math.PI / 2 + 0.1}
                minAzimuthAngle={-0.1}
                maxAzimuthAngle={0.1}
                target={[0, 0, 0]}
              />
            )}
          </Suspense>
        </Canvas>
      </div>
      
      {/* Modern Floating Control Bar */}
      <FloatingControlBar 
        currentDay={currentDay}
        totalDays={totalDays}
        autoplay={autoplay}
        soundEnabled={soundEnabled}
        cameraMode={cameraMode}
        viewMode={viewMode}
        onDayChange={handleDayChange}
        onToggleAutoplay={toggleAutoplay}
        onToggleSound={toggleSound}
        onToggleCameraMode={toggleCameraMode}
        onToggleViewMode={toggleViewMode}
        onShowInfo={toggleInfo}
      />
      
      <Timeline 
        currentDay={currentDay} 
        totalDays={totalDays} 
        onDayChange={handleDayChange} 
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
        </div>
        <button className="close-info-button" onClick={toggleInfo}>ZAVŘÍT</button>
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