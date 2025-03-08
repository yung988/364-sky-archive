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
  
  // Log path for debugging
  const path = `/images/day_${imageNumber}.jpg`;
  console.log("Loading image from path:", path);
  return path;
};

// Jednoduchý materiál pro prolínání obrázků
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
    if (texture) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16; // Vyšší hodnota pro lepší kvalitu
      texture.needsUpdate = true;
    }
    
    if (nextTexture) {
      nextTexture.minFilter = THREE.LinearFilter;
      nextTexture.magFilter = THREE.LinearFilter;
      nextTexture.anisotropy = 16; // Vyšší hodnota pro lepší kvalitu
      nextTexture.needsUpdate = true;
    }
  }, [texture, nextTexture]);
  
  // Handle day change and start transition
  useEffect(() => {
    if (currentDay !== prevDay && !isTransitioning) {
      console.log(`Starting transition from day ${prevDay} to day ${currentDay}`);
      setIsTransitioning(true);
      
      // Jednoduchý lineární přechod
      gsap.to({}, {
        duration: 1.5, // Kratší doba pro rychlejší přechod
        onUpdate: function() {
          setTransitionProgress(this.progress());
        },
        onComplete: function() {
          setPrevDay(currentDay);
          setTransitionProgress(0);
          setIsTransitioning(false);
        },
        ease: "power1.inOut" // Mírný easing pro plynulejší přechod
      });
    }
  }, [currentDay, prevDay, isTransitioning]);
  
  // Vytvoříme jednoduchý materiál pro prolínání obrázků
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
        vec4 color1 = texture2D(texture1, vUv);
        vec4 color2 = texture2D(texture2, vUv);
        gl_FragColor = mix(color1, color2, mixRatio);
      }
    `,
    transparent: true,
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