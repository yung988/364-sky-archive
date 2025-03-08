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
    nextMap: null,
    time: 0,
    transitionProgress: 0,
    distortionIntensity: 0.1,
    colorShift: 0.05,
    dayIndex: 0,
    sunPosition: new THREE.Vector3(0, 1, 0)
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform sampler2D map;
    uniform sampler2D nextMap;
    uniform float time;
    uniform float transitionProgress;
    uniform float colorShift;
    uniform float dayIndex;
    uniform vec3 sunPosition;
    
    void main() {
      // Upravíme UV souřadnice tak, aby obloha byla nad námi
      // Chceme, aby obloha byla vidět hlavně nad námi, takže upravíme mapování textury
      vec2 uv = vUv;
      
      // Jemná distorze pro přirozenější vzhled
      float distortion = sin(uv.y * 5.0 + time * 0.2) * 0.005;
      uv.x += distortion;
      
      // Vzorkujeme aktuální a následující texturu
      vec4 currentColor = texture2D(map, uv);
      vec4 nextColor = texture2D(nextMap, uv);
      
      // Plynulý přechod mezi dny
      vec4 color = mix(currentColor, nextColor, smoothstep(0.0, 1.0, transitionProgress));
      
      // Přidáme jemný barevný posun podle dne
      float dayFactor = mod(dayIndex, 364.0) / 364.0;
      float r = color.r + sin(dayFactor * 3.14159 * 2.0) * colorShift;
      float g = color.g + sin(dayFactor * 3.14159 * 2.0 + 2.0) * colorShift;
      float b = color.b + sin(dayFactor * 3.14159 * 2.0 + 4.0) * colorShift;
      
      // Přidáme vinětaci pro lepší vzhled
      float vignette = 1.0 - smoothstep(0.5, 1.0, length(vUv - 0.5) * 1.5);
      
      // Efekt slunce - jasnější v horní části oblohy
      float sunEffect = 0.0;
      vec3 normalizedPos = normalize(vPosition);
      float sunDot = max(0.0, dot(normalizedPos, normalize(sunPosition)));
      sunEffect = pow(sunDot, 32.0) * 0.5;
      
      // Kombinace všech efektů
      vec3 finalColor = vec3(r, g, b) * vignette;
      finalColor += vec3(1.0, 0.9, 0.7) * sunEffect;
      
      gl_FragColor = vec4(finalColor, color.a);
    }
  `
);

// Extend Three Fiber with our custom material
extend({ SkyShaderMaterial });

const SkyGallery = ({ currentDay, totalDays }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const groundRef = useRef();
  const { viewport, clock } = useThree();
  const [prevDay, setPrevDay] = useState(currentDay);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Calculate next day
  const nextDay = (currentDay + 1) % totalDays;
  
  // Load the current day's texture
  const texture = useTexture(getImagePath(currentDay));
  
  // Load the next day's texture for smooth transitions
  const nextTexture = useTexture(getImagePath(nextDay));
  
  // Configure texture settings
  useEffect(() => {
    if (texture) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
    }
    
    if (nextTexture) {
      nextTexture.minFilter = THREE.LinearFilter;
      nextTexture.magFilter = THREE.LinearFilter;
      nextTexture.needsUpdate = true;
    }
  }, [texture, nextTexture]);
  
  // Handle day change and start transition
  useEffect(() => {
    if (currentDay !== prevDay && !isTransitioning) {
      console.log(`Starting transition from day ${prevDay} to day ${currentDay}`);
      setIsTransitioning(true);
      
      // Start a very slow and smooth transition
      gsap.to({}, {
        duration: 5.0, // Delší doba pro plynulejší přechod
        onUpdate: function() {
          setTransitionProgress(this.progress());
        },
        onComplete: function() {
          setPrevDay(currentDay);
          setTransitionProgress(0);
          setIsTransitioning(false);
        },
        ease: "power1.inOut" // Plynulejší přechodová funkce
      });
    }
  }, [currentDay, prevDay, isTransitioning]);
  
  // Calculate sun position based on time of day
  const sunPosition = useMemo(() => {
    const dayProgress = currentDay / totalDays;
    // Slunce se pohybuje po obloze od východu k západu
    const angle = Math.PI * (dayProgress * 2);
    return new THREE.Vector3(
      Math.cos(angle),
      Math.sin(angle),
      0.5 // Slunce je vždy nad horizontem
    );
  }, [currentDay, totalDays]);
  
  // Update shader uniforms on each frame
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.dayIndex.value = currentDay;
      materialRef.current.uniforms.transitionProgress.value = transitionProgress;
      materialRef.current.uniforms.sunPosition.value = sunPosition;
      
      // Ensure textures are set
      if (texture) materialRef.current.uniforms.map.value = texture;
      if (nextTexture) materialRef.current.uniforms.nextMap.value = nextTexture;
    }
    
    if (meshRef.current) {
      // Velmi jemná rotace - simuluje pohyb oblohy
      meshRef.current.rotation.y += delta * 0.005;
    }
    
    // Rotace země - simuluje otáčení Země
    if (groundRef.current) {
      groundRef.current.rotation.y += delta * 0.01;
    }
  });
  
  return (
    <group>
      {/* Země pod námi */}
      <mesh ref={groundRef} position={[0, -10, 0]}>
        <sphereGeometry args={[9.9, 32, 32]} />
        <meshStandardMaterial 
          color="#2a6e12" 
          roughness={0.8}
          metalness={0.1}
          map={null}
        />
      </mesh>
      
      {/* Obloha kolem nás */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[20, 64, 64]} />
        <skyShaderMaterial 
          ref={materialRef}
          map={texture} 
          nextMap={nextTexture}
          side={THREE.BackSide}
          transparent={true}
          distortionIntensity={0.1}
          colorShift={0.05}
          dayIndex={currentDay}
          transitionProgress={transitionProgress}
          sunPosition={sunPosition}
        />
      </mesh>
      
      {/* Světlo simulující slunce */}
      <directionalLight 
        position={[sunPosition.x * 10, sunPosition.y * 10, sunPosition.z * 10]} 
        intensity={1.5} 
        color="#ffeecc" 
      />
      
      {/* Ambientní světlo pro základní osvětlení scény */}
      <ambientLight intensity={0.3} />
    </group>
  );
};

export default SkyGallery; 