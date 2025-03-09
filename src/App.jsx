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
        <div className="day-counter">
          Den {currentDay + 1} / {totalDays}
        </div>
        <div className="control-buttons">
          {/* Autoplay button */}
          <button 
            className={`control-btn ${autoplay ? 'active' : ''}`} 
            onClick={onToggleAutoplay}
            title={autoplay ? "Zastavit přehrávání" : "Spustit přehrávání"}
          >
            {autoplay ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
            <span>{autoplay ? 'Zastavit' : 'Přehrát'}</span>
          </button>
          
          {/* Previous day button */}
          <button 
            className="control-btn" 
            onClick={() => onDayChange(-1)}
            title="Předchozí den"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Předchozí</span>
          </button>
          
          {/* Next day button */}
          <button 
            className="control-btn" 
            onClick={() => onDayChange(1)}
            title="Následující den"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span>Další</span>
          </button>
          
          {/* View mode toggle button */}
          <button 
            className={`control-btn ${viewMode === '2d' ? 'active' : ''}`} 
            onClick={onToggleViewMode}
            title={viewMode === '3d' ? "Přepnout na 2D zobrazení" : "Přepnout na 3D zobrazení"}
          >
            {viewMode === '3d' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
            <span>{viewMode === '3d' ? '2D' : '3D'}</span>
          </button>
          
          {/* Camera mode toggle button - only in 3D mode */}
          {viewMode === '3d' && (
            <button 
              className={`control-btn ${cameraMode === 'fly' ? 'active' : ''}`} 
              onClick={onToggleCameraMode}
              title={cameraMode === 'orbit' ? "Přepnout na volný pohyb" : "Přepnout na orbitální pohyb"}
            >
              {cameraMode === 'orbit' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"></path>
                  <polygon points="12 15 17 21 7 21 12 15"></polygon>
                </svg>
              )}
              <span>{cameraMode === 'orbit' ? 'Volný' : 'Orbit'}</span>
            </button>
          )}
          
          {/* Sound toggle button */}
          <button 
            className={`control-btn ${soundEnabled ? 'active' : ''}`} 
            onClick={onToggleSound}
            title={soundEnabled ? "Vypnout zvuk" : "Zapnout zvuk"}
          >
            {soundEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            )}
            <span>{soundEnabled ? 'Zvuk' : 'Ztlumeno'}</span>
          </button>
          
          {/* Info button */}
          <button 
            className="control-btn info-btn" 
            onClick={onShowInfo}
            title="Zobrazit informace o projektu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Info</span>
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
    try {
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
      
      // Předem načteme zvuky
      ambientSound.load();
      transitionSound.load();
      uiClickSound.load();
      
      // Přidáme error handler pro zvuky
      const handleAudioError = (e) => {
        console.warn("Audio loading failed:", e);
        // Vypneme zvuk, pokud nastane chyba
        setSoundEnabled(false);
      };
      
      ambientSound.addEventListener('error', handleAudioError);
      transitionSound.addEventListener('error', handleAudioError);
      uiClickSound.addEventListener('error', handleAudioError);
      
      // Cleanup on unmount
      return () => {
        if (ambientSoundRef.current) {
          ambientSoundRef.current.pause();
          ambientSoundRef.current.removeEventListener('error', handleAudioError);
        }
        if (transitionSoundRef.current) {
          transitionSoundRef.current.removeEventListener('error', handleAudioError);
        }
        if (uiClickSoundRef.current) {
          uiClickSoundRef.current.removeEventListener('error', handleAudioError);
        }
      };
    } catch (error) {
      console.error("Error initializing sounds:", error);
      setSoundEnabled(false);
    }
  }, []);
  
  // Toggle sound
  useEffect(() => {
    if (soundEnabled && ambientSoundRef.current) {
      ambientSoundRef.current.play()
        .catch(e => {
          console.warn("Audio play failed:", e);
          setSoundEnabled(false);
        });
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
            try {
              transitionSoundRef.current.currentTime = 0;
              transitionSoundRef.current.play()
                .catch(e => console.warn("Audio play failed:", e));
            } catch (error) {
              console.warn("Error playing transition sound:", error);
            }
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
    if (uiClickSoundRef.current) {
      try {
        uiClickSoundRef.current.currentTime = 0;
        uiClickSoundRef.current.play()
          .catch(e => console.warn("Audio play failed:", e));
      } catch (error) {
        console.warn("Error playing UI click sound:", error);
      }
    }
    
    setAutoplay(!autoplay);
  };
  
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    
    // Play UI click sound if enabling sound
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
  
  // Toggle info panel
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
    
    // Toggle info panel visibility
    setShowInfo(prev => !prev);
  };
  
  const changeAutoplaySpeed = (speed) => {
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