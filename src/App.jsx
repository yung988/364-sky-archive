import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import SkyGallery from './components/SkyGallery';
import Timeline from './components/Timeline';
import './styles.css';

function App() {
  const [currentDay, setCurrentDay] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const totalDays = 364;

  // Handle autoplay functionality
  useEffect(() => {
    let interval;
    if (autoplay) {
      interval = setInterval(() => {
        setCurrentDay((prev) => (prev + 1) % totalDays);
      }, 2000); // Change image every 2 seconds
    }
    return () => clearInterval(interval);
  }, [autoplay, totalDays]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDayChange = (day) => {
    setCurrentDay(day);
    if (autoplay) setAutoplay(false);
  };

  const toggleAutoplay = () => {
    setAutoplay(!autoplay);
  };

  if (isLoading) {
    return (
      <div className="loader">
        <div className="loader-spinner"></div>
        <div className="loader-text">NAČÍTÁNÍ VOLUMETRICKÝCH OBLOH</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <SkyGallery currentDay={currentDay} totalDays={totalDays} />
          <OrbitControls enableZoom={true} enablePan={true} />
        </Canvas>
      </div>
      
      <div className="counter">DEN {currentDay + 1} / {totalDays}</div>
      
      <Timeline 
        currentDay={currentDay} 
        totalDays={totalDays} 
        onDayChange={handleDayChange} 
      />
      
      <button className="autoplay-button" onClick={toggleAutoplay}>
        {autoplay ? "ZASTAVIT" : "PŘEHRÁT"}
      </button>
    </div>
  );
}

export default App; 