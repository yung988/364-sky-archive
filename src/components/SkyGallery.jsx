import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { extend } from '@react-three/fiber';

// Helper function to get image path based on day index
const getImagePath = (dayIndex) => {
  // Since we only have 8 images, we'll cycle through them
  const availableImages = 8;
  const imageNumber = (dayIndex % availableImages) + 1;
  
  // Log path for debugging
  const path = `/images/day_${imageNumber}.JPG`;
  console.log("Loading image from path:", path);
  return path;
};

// Sky shader material for artistic effects
const SkyShaderMaterial = shaderMaterial(
  {
    map: null,
    time: 0,
    distortionIntensity: 0.1,
    colorShift: 0.05,
    dayIndex: 0
  },
  // Vertex shader
  `
    varying vec2 vUv;
    uniform float time;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    varying vec2 vUv;
    uniform sampler2D map;
    uniform float time;
    uniform float colorShift;
    uniform float dayIndex;
    
    void main() {
      // Subtle UV distortion
      vec2 uv = vUv;
      float distortion = sin(uv.y * 5.0 + time * 0.2) * 0.005;
      uv.x += distortion;
      
      // Sample the texture
      vec4 color = texture2D(map, uv);
      
      // Add a subtle color shift based on day index
      float dayFactor = mod(dayIndex, 364.0) / 364.0;
      float r = color.r + sin(dayFactor * 3.14159 * 2.0) * colorShift;
      float g = color.g + sin(dayFactor * 3.14159 * 2.0 + 2.0) * colorShift;
      float b = color.b + sin(dayFactor * 3.14159 * 2.0 + 4.0) * colorShift;
      
      // Add a subtle vignette effect
      float vignette = 1.0 - smoothstep(0.5, 1.0, length(vUv - 0.5) * 1.5);
      
      gl_FragColor = vec4(r * vignette, g * vignette, b * vignette, color.a);
    }
  `
);

// Extend Three Fiber with our custom material
extend({ SkyShaderMaterial });

const SkyGallery = ({ currentDay, totalDays }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const { viewport, clock } = useThree();
  const [prevDay, setPrevDay] = useState(currentDay);
  const [prevTexture, setPrevTexture] = useState(null);
  const [textureLoaded, setTextureLoaded] = useState(false);
  
  // Load the current day's texture
  const texture = useTexture(getImagePath(currentDay), (loadedTexture) => {
    console.log("Texture loaded successfully:", getImagePath(currentDay));
    setTextureLoaded(true);
  });
  
  // Configure texture settings
  useEffect(() => {
    if (texture) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      
      // Log texture information for debugging
      console.log("Texture dimensions:", texture.image?.width, "x", texture.image?.height);
    }
  }, [texture]);
  
  // Animation effect when day changes
  useEffect(() => {
    if (currentDay !== prevDay && meshRef.current) {
      // Store previous texture for transition
      setPrevTexture(texture);
      setPrevDay(currentDay);
      
      // Create a timeline for the animation
      const tl = gsap.timeline();
      
      // Animate the mesh rotation
      tl.to(meshRef.current.rotation, {
        y: meshRef.current.rotation.y + Math.PI / 6,
        duration: 1.5,
        ease: "power2.inOut"
      });
      
      // Animate distortion intensity for transition effect
      if (materialRef.current) {
        tl.fromTo(materialRef.current.uniforms.distortionIntensity, 
          { value: 0.3 },
          { value: 0.1, duration: 2, ease: "power2.out" },
          0
        );
      }
    }
  }, [currentDay, prevDay, texture]);
  
  // Update shader uniforms on each frame
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.dayIndex.value = currentDay;
    }
    
    if (meshRef.current) {
      // Very gentle continuous rotation
      meshRef.current.rotation.y += delta * 0.02;
    }
  });
  
  return (
    <group>
      {/* Sky sphere - we're inside looking out */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[10, 64, 64]} />
        <skyShaderMaterial 
          ref={materialRef}
          map={texture} 
          side={THREE.BackSide}
          transparent={true}
          distortionIntensity={0.1}
          colorShift={0.05}
          dayIndex={currentDay}
        />
      </mesh>
    </group>
  );
};

export default SkyGallery; 