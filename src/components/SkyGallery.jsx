import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

// Helper function to get image path based on day index
const getImagePath = (dayIndex) => {
  // Since we only have 8 images, we'll cycle through them
  const availableImages = 8;
  const imageNumber = (dayIndex % availableImages) + 1;
  
  // Use base URL for GitHub Pages
  const baseUrl = import.meta.env.BASE_URL || '/';
  const path = `${baseUrl}images/day_${imageNumber}.JPG`;
  console.log("Loading image from path:", path);
  return path;
};

// Komponenta pro zobrazení oblohy
const SkyGallery = ({ currentDay, totalDays }) => {
  const meshRef = useRef();
  const { viewport, camera } = useThree();
  const [prevDay, setPrevDay] = useState(currentDay);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Calculate next day
  const nextDay = (currentDay + 1) % totalDays;
  
  // Load the current day's texture
  const texture = useTexture(getImagePath(currentDay));
  
  // Load the next day's texture for smooth transitions
  const nextTexture = useTexture(getImagePath(nextDay));
  
  // Configure texture settings for maximální kvalitu
  useEffect(() => {
    const configureTexture = (tex) => {
      if (tex) {
        // Nastavení pro maximální kvalitu
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16; // Vyšší hodnota pro lepší kvalitu
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = false; // Vypnutí mipmapování pro ostřejší obraz
        tex.needsUpdate = true;
      }
    };
    
    configureTexture(texture);
    configureTexture(nextTexture);
  }, [texture, nextTexture]);
  
  // Handle day change and start transition
  useEffect(() => {
    if (currentDay !== prevDay && !isTransitioning) {
      console.log(`Starting transition from day ${prevDay} to day ${currentDay}`);
      setIsTransitioning(true);
      
      // Jednoduchý lineární přechod
      gsap.to({}, {
        duration: 0.8, // Kratší doba pro rychlejší přechod
        onUpdate: function() {
          setTransitionProgress(this.progress());
        },
        onComplete: function() {
          setPrevDay(currentDay);
          setTransitionProgress(0);
          setIsTransitioning(false);
        },
        ease: "none" // Lineární přechod bez easingu
      });
    }
  }, [currentDay, prevDay, isTransitioning]);
  
  // Vytvoříme shader materiál pro prolínání obrázků
  const material = new THREE.ShaderMaterial({
    uniforms: {
      texture1: { value: texture },
      texture2: { value: nextTexture },
      mixRatio: { value: transitionProgress },
    },
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D texture1;
      uniform sampler2D texture2;
      uniform float mixRatio;
      varying vec2 vUv;
      
      void main() {
        // Přesné vzorkování textur
        vec4 color1 = texture2D(texture1, vUv);
        vec4 color2 = texture2D(texture2, vUv);
        
        // Lineární mix mezi texturami
        gl_FragColor = mix(color1, color2, mixRatio);
      }
    `,
    side: THREE.BackSide
  });
  
  // Update material uniforms on each frame
  useFrame(() => {
    if (material) {
      material.uniforms.texture1.value = texture;
      material.uniforms.texture2.value = nextTexture;
      material.uniforms.mixRatio.value = transitionProgress;
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[20, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export default SkyGallery; 