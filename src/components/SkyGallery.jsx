import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, shaderMaterial, Stars, Cloud } from '@react-three/drei';
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
    sunPosition: new THREE.Vector3(0, 1, 0),
    isDayTime: 1.0, // 1.0 for day, 0.0 for night
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
    uniform float isDayTime;
    
    // Funkce pro generování hvězd
    float stars(vec2 uv, float threshold) {
      float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
      return step(threshold, noise) * noise;
    }
    
    void main() {
      // Upravíme UV souřadnice tak, aby obloha byla nad námi
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
      
      // Hvězdy - viditelné pouze v noci
      float starsEffect = 0.0;
      if (isDayTime < 0.5) {
        // Generujeme hvězdy různých velikostí
        float stars1 = stars(vUv * 500.0, 0.996) * 0.5;
        float stars2 = stars(vUv * 1000.0, 0.998) * 0.3;
        float stars3 = stars(vUv * 2000.0, 0.999) * 0.2;
        
        // Hvězdy jsou jasnější v horní části oblohy
        float starsGradient = smoothstep(0.0, 1.0, normalizedPos.y * 0.5 + 0.5);
        starsEffect = (stars1 + stars2 + stars3) * starsGradient * (1.0 - isDayTime);
      }
      
      // Kombinace všech efektů
      vec3 finalColor = vec3(r, g, b) * vignette;
      finalColor += vec3(1.0, 0.9, 0.7) * sunEffect;
      
      // Přidáme hvězdy
      finalColor += vec3(0.9, 0.95, 1.0) * starsEffect;
      
      // Přechod mezi dnem a nocí
      finalColor = mix(
        vec3(0.05, 0.05, 0.15), // Noční barva
        finalColor,              // Denní barva
        isDayTime
      );
      
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
  const starsRef = useRef();
  const cloudsRef = useRef([]);
  const { viewport, clock } = useThree();
  const [prevDay, setPrevDay] = useState(currentDay);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDayTime, setIsDayTime] = useState(true);
  
  // Načtení textury trávy
  const grassTexture = useTexture('/textures/grass.jpg');
  
  // Konfigurace textury trávy
  useEffect(() => {
    if (grassTexture) {
      grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
      grassTexture.repeat.set(20, 20);
      grassTexture.anisotropy = 16;
      grassTexture.encoding = THREE.sRGBEncoding;
    }
  }, [grassTexture]);
  
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
  
  // Determine if it's day or night based on sun position
  useEffect(() => {
    // Pokud je slunce pod horizontem, je noc
    const isDay = sunPosition.y > 0;
    
    // Plynulý přechod mezi dnem a nocí
    gsap.to({}, {
      duration: 3.0,
      onUpdate: function() {
        const progress = this.progress();
        setIsDayTime(isDay ? progress : 1 - progress);
      },
      ease: "power1.inOut"
    });
  }, [sunPosition]);
  
  // Generujeme náhodné pozice pro mraky
  const cloudPositions = useMemo(() => {
    const positions = [];
    const count = 25; // Zvýšený počet mraků pro lepší pokrytí oblohy
    
    for (let i = 0; i < count; i++) {
      // Rovnoměrnější rozložení mraků po celé obloze
      const theta = (i / count) * Math.PI * 2 + Math.random() * 0.5; // Rovnoměrnější rozložení + trochu náhody
      const phi = Math.random() * Math.PI * 0.4 + Math.PI * 0.1; // Mraky jsou hlavně nad horizontem
      const radius = 18 + Math.random() * 1.5; // Vzdálenost od středu - blíže ke kopuli oblohy
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // Náhodná velikost a MNOHEM POMALEJŠÍ rychlost
      const size = 4 + Math.random() * 6; // Větší mraky
      const speed = 0.0005 + Math.random() * 0.001; // Výrazně snížená rychlost
      const opacity = 0.6 + Math.random() * 0.4;
      
      positions.push({ position: [x, y, z], size, speed, theta, radius, phi, opacity });
    }
    
    return positions;
  }, []);
  
  // Update shader uniforms on each frame
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.dayIndex.value = currentDay;
      materialRef.current.uniforms.transitionProgress.value = transitionProgress;
      materialRef.current.uniforms.sunPosition.value = sunPosition;
      materialRef.current.uniforms.isDayTime.value = isDayTime ? 1.0 : 0.0;
      
      // Ensure textures are set
      if (texture) materialRef.current.uniforms.map.value = texture;
      if (nextTexture) materialRef.current.uniforms.nextMap.value = nextTexture;
    }
    
    if (meshRef.current) {
      // Velmi jemná rotace - simuluje pohyb oblohy
      meshRef.current.rotation.y += delta * 0.001; // Pomalejší rotace oblohy
    }
    
    // Rotace země - simuluje otáčení Země
    if (groundRef.current) {
      groundRef.current.rotation.y += delta * 0.002; // Pomalejší rotace země
    }
    
    // Aktualizace pozic mraků
    cloudsRef.current.forEach((cloud, index) => {
      if (cloud && cloudPositions[index]) {
        const { theta, radius, speed, phi } = cloudPositions[index];
        const newTheta = theta + delta * speed;
        
        // Správný výpočet pozice na sféře
        const x = radius * Math.sin(phi) * Math.cos(newTheta);
        const y = radius * Math.sin(phi) * Math.sin(newTheta);
        const z = radius * Math.cos(phi);
        
        cloud.position.x = x;
        cloud.position.y = y;
        cloud.position.z = z;
        
        // Aktualizujeme theta pro další snímek
        cloudPositions[index].theta = newTheta;
        
        // Mraky jsou méně viditelné v noci
        if (cloud.material) {
          cloud.material.opacity = cloudPositions[index].opacity * (isDayTime ? 1.0 : 0.3);
        }
      }
    });
  });
  
  return (
    <group>
      {/* Země pod námi - upravená jako skutečný povrch */}
      <mesh ref={groundRef} position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#4a8c32" 
          roughness={0.9}
          metalness={0.0}
          map={grassTexture}
        />
      </mesh>
      
      {/* Přidáme několik detailů na zem - kameny, květiny atd. */}
      <group position={[2, -1.45, 3]}>
        <mesh>
          <boxGeometry args={[0.5, 0.1, 0.4]} />
          <meshStandardMaterial color="#888888" roughness={0.8} />
        </mesh>
      </group>
      
      <group position={[-3, -1.45, 2]}>
        <mesh>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color="#777777" roughness={0.9} />
        </mesh>
      </group>
      
      {/* Několik květin */}
      {[...Array(15)].map((_, i) => {
        const x = Math.random() * 20 - 10;
        const z = Math.random() * 20 - 10;
        const height = 0.2 + Math.random() * 0.3;
        const color = Math.random() > 0.5 ? "#ffff00" : "#ffffff";
        
        return (
          <group key={i} position={[x, -1.45, z]}>
            {/* Stonek */}
            <mesh position={[0, height/2, 0]}>
              <boxGeometry args={[0.05, height, 0.05]} />
              <meshStandardMaterial color="#2a6e12" />
            </mesh>
            {/* Květ */}
            <mesh position={[0, height, 0]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
            </mesh>
          </group>
        );
      })}
      
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
          isDayTime={isDayTime ? 1.0 : 0.0}
        />
      </mesh>
      
      {/* Mraky */}
      {cloudPositions.map((cloudData, index) => (
        <Cloud
          key={index}
          ref={(el) => (cloudsRef.current[index] = el)}
          position={cloudData.position}
          args={[cloudData.size, 2]}
          opacity={cloudData.opacity}
          speed={0}
          width={cloudData.size}
          depth={1.5}
          segments={20}
        />
      ))}
      
      {/* Hvězdy pro noční oblohu */}
      <group ref={starsRef}>
        <Stars 
          radius={19} 
          depth={5} 
          count={5000} 
          factor={4} 
          saturation={0.5} 
          fade
          speed={0.1}
        />
      </group>
      
      {/* Světlo simulující slunce */}
      <directionalLight 
        position={[sunPosition.x * 10, sunPosition.y * 10, sunPosition.z * 10]} 
        intensity={isDayTime ? 1.5 : 0.1} 
        color={isDayTime ? "#ffeecc" : "#334466"} 
      />
      
      {/* Ambientní světlo pro základní osvětlení scény */}
      <ambientLight intensity={isDayTime ? 0.3 : 0.05} color={isDayTime ? "#ffffff" : "#223344"} />
    </group>
  );
};

export default SkyGallery; 