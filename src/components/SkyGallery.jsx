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
    
    // Helper function for soft light effect
    float softLight(float base, float blend) {
      return (blend < 0.5) 
        ? 2.0 * base * blend + base * base * (1.0 - 2.0 * blend)
        : 2.0 * base * (1.0 - blend) + sqrt(base) * (2.0 * blend - 1.0);
    }
    
    void main() {
      // Subtle UV distortion
      vec2 uv = vUv;
      float distortion = sin(uv.y * 5.0 + time * 0.2) * 0.005;
      uv.x += distortion;
      
      // Sample the current and next textures
      vec4 currentColor = texture2D(map, uv);
      vec4 nextColor = texture2D(nextMap, uv);
      
      // Smooth transition between days
      vec4 color = mix(currentColor, nextColor, smoothstep(0.0, 1.0, transitionProgress));
      
      // Add a subtle color shift based on day index
      float dayFactor = mod(dayIndex, 364.0) / 364.0;
      float r = color.r + sin(dayFactor * 3.14159 * 2.0) * colorShift;
      float g = color.g + sin(dayFactor * 3.14159 * 2.0 + 2.0) * colorShift;
      float b = color.b + sin(dayFactor * 3.14159 * 2.0 + 4.0) * colorShift;
      
      // Add a subtle vignette effect
      float vignette = 1.0 - smoothstep(0.5, 1.0, length(vUv - 0.5) * 1.5);
      
      // Add sun light effect
      float sunEffect = 0.0;
      vec3 normalizedPos = normalize(vPosition);
      float sunDot = max(0.0, dot(normalizedPos, normalize(sunPosition)));
      sunEffect = pow(sunDot, 32.0) * 0.5;
      
      // Add subtle light rays
      float rayEffect = pow(sunDot, 16.0) * 0.3 * (0.5 + 0.5 * sin(time * 0.2));
      
      // Combine all effects
      vec3 finalColor = vec3(r, g, b) * vignette;
      finalColor += vec3(1.0, 0.9, 0.7) * sunEffect;
      finalColor += vec3(1.0, 0.8, 0.6) * rayEffect;
      
      gl_FragColor = vec4(finalColor, color.a);
    }
  `
);

// Extend Three Fiber with our custom material
extend({ SkyShaderMaterial });

// Komponenta pro jeden panel oblohy
const SkyPanel = ({ texture, position, rotation }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
};

const SkyGallery = ({ currentDay, totalDays }) => {
  const groupRef = useRef();
  const { viewport, clock } = useThree();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [skyPanels, setSkyPanels] = useState([]);
  const [speed, setSpeed] = useState(0.5); // Rychlost pohybu oblohy
  
  // Načtení textur pro aktuální a okolní dny
  const textures = useMemo(() => {
    const result = [];
    // Načteme textury pro 5 dnů (aktuální, 2 předchozí, 2 následující)
    for (let i = -2; i <= 2; i++) {
      const day = (currentDay + i + totalDays) % totalDays;
      result.push({
        day,
        path: getImagePath(day)
      });
    }
    return result;
  }, [currentDay, totalDays]);
  
  // Načtení textur
  const loadedTextures = textures.map(item => {
    return {
      day: item.day,
      texture: useTexture(item.path)
    };
  });
  
  // Konfigurace textur
  useEffect(() => {
    loadedTextures.forEach(item => {
      if (item.texture) {
        item.texture.minFilter = THREE.LinearFilter;
        item.texture.magFilter = THREE.LinearFilter;
        item.texture.needsUpdate = true;
      }
    });
  }, [loadedTextures]);
  
  // Vytvoření panelů oblohy
  useEffect(() => {
    // Vytvoříme 5 panelů oblohy v řadě nad pozorovatelem
    const panels = loadedTextures.map((item, index) => {
      const position = [0, 30 * (index - 2), 10]; // Panely jsou umístěny v řadě nad pozorovatelem
      const rotation = [-Math.PI / 2, 0, 0]; // Otočení, aby byly vidět shora
      
      return {
        day: item.day,
        texture: item.texture,
        position,
        rotation,
        key: `sky-panel-${item.day}`
      };
    });
    
    setSkyPanels(panels);
  }, [loadedTextures]);
  
  // Animace pohybu oblohy
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Posouváme celou skupinu panelů směrem k pozorovateli
      groupRef.current.position.y -= delta * speed;
      
      // Když první panel zmizí za pozorovatelem, přesuneme ho na konec řady
      if (groupRef.current.position.y < -30) {
        groupRef.current.position.y += 30;
        
        // Aktualizujeme panely - posuneme je o jeden den dopředu
        setSkyPanels(prev => {
          const newPanels = [...prev];
          // Vezmeme první panel a přesuneme ho na konec
          const firstPanel = newPanels.shift();
          // Aktualizujeme jeho den a texturu
          const newDay = (currentDay + 3) % totalDays;
          firstPanel.day = newDay;
          firstPanel.texture = useTexture(getImagePath(newDay));
          firstPanel.position = [0, 30 * 2, 10]; // Umístíme ho na konec řady
          newPanels.push(firstPanel);
          return newPanels;
        });
      }
    }
  });
  
  return (
    <group>
      {/* Travnatý povrch pod pozorovatelem */}
      <mesh position={[0, 0, -1]} rotation={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2a6e12" roughness={0.8} />
      </mesh>
      
      {/* Skupina panelů oblohy */}
      <group ref={groupRef}>
        {skyPanels.map(panel => (
          <SkyPanel 
            key={panel.key}
            texture={panel.texture}
            position={panel.position}
            rotation={panel.rotation}
          />
        ))}
      </group>
      
      {/* Světlo simulující slunce */}
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={1} 
        color="#ffeecc" 
      />
      
      {/* Ambientní světlo pro základní osvětlení scény */}
      <ambientLight intensity={0.5} />
    </group>
  );
};

export default SkyGallery; 