import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Helper function to get image path based on day index
const getImagePath = (dayIndex) => {
  // Since we only have 8 images, we'll cycle through them
  const availableImages = 8;
  const imageNumber = (dayIndex % availableImages) + 1;
  
  // Log path for debugging
  const path = `/images/day_${imageNumber}.jpg`;
  console.log("Loading image from path:", path);
  return path;
};

// Jednoduchý materiál pro prolínání obrázků
const SkyGallery = ({ currentDay, totalDays }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const { viewport, camera } = useThree();
  const [opacity, setOpacity] = useState(1);
  
  // Load the current day's texture
  const texture = useTexture(getImagePath(currentDay));
  
  // Configure texture settings for maximální kvalitu
  useEffect(() => {
    if (texture) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16; // Vyšší hodnota pro lepší kvalitu
      texture.needsUpdate = true;
    }
  }, [texture]);
  
  // Vytvoříme jednoduchý materiál pro zobrazení obrázku
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    transparent: false
  });
  
  // Aktualizace materiálu při změně dne
  useEffect(() => {
    if (material && texture) {
      material.map = texture;
      material.needsUpdate = true;
    }
  }, [currentDay, texture]);
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[20, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export default SkyGallery; 