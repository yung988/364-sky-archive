import React, { useRef, useEffect, useState, useMemo } from 'react';
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
  return path;
};

// Komponenta pro zobrazení oblohy
const SkyGallery = ({ currentDay, totalDays }) => {
  const meshRef = useRef();
  const { viewport, camera } = useThree();
  const [prevDay, setPrevDay] = useState(currentDay);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Předpřipravíme cesty ke všem texturám
  const texturePaths = useMemo(() => {
    const paths = [];
    for (let i = 0; i < 8; i++) {
      paths.push(getImagePath(i));
    }
    return paths;
  }, []);
  
  // Načteme všechny textury najednou
  const allTextures = useTexture(texturePaths);
  
  // Funkce pro získání textury podle dne
  const getTextureForDay = (day) => {
    const index = day % 8;
    return allTextures[index];
  };
  
  // Aktuální a předchozí textura
  const currentTexture = getTextureForDay(currentDay);
  const prevTexture = getTextureForDay(prevDay);
  
  // Configure texture settings for maximální kvalitu
  useEffect(() => {
    // Nastavíme všechny textury najednou
    allTextures.forEach(tex => {
      if (tex) {
        // Nastavení pro maximální kvalitu
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16; // Vyšší hodnota pro lepší kvalitu
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = false; // Vypnutí mipmapování pro ostřejší obraz
        
        // Stranové otočení obrázků
        tex.repeat.set(-1, 1);
        tex.offset.set(1, 0);
        
        tex.needsUpdate = true;
      }
    });
  }, [allTextures]);
  
  // Handle day change and start transition
  useEffect(() => {
    if (currentDay !== prevDay && !isTransitioning) {
      setIsTransitioning(true);
      
      // Plynulejší přechod
      gsap.to({}, {
        duration: 1.0, // Delší doba pro plynulejší přechod
        onUpdate: function() {
          setTransitionProgress(this.progress());
        },
        onComplete: function() {
          setPrevDay(currentDay);
          setTransitionProgress(0);
          setIsTransitioning(false);
        },
        ease: "power1.inOut" // Plynulejší přechod s easingem
      });
    }
  }, [currentDay, prevDay, isTransitioning]);
  
  // Velmi pomalá rotace oblohy
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Extrémně pomalá rotace - přibližně jeden obrat za hodinu
      meshRef.current.rotation.y += delta * 0.0005;
    }
    
    // Aktualizace materiálu
    if (material) {
      material.uniforms.texture1.value = prevTexture;
      material.uniforms.texture2.value = currentTexture;
      material.uniforms.mixRatio.value = transitionProgress;
    }
  });
  
  // Vytvoříme shader materiál pro prolínání obrázků
  const material = new THREE.ShaderMaterial({
    uniforms: {
      texture1: { value: prevTexture },
      texture2: { value: currentTexture },
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
        
        // Plynulý mix mezi texturami s easingem
        float smoothMix = smoothstep(0.0, 1.0, mixRatio);
        gl_FragColor = mix(color1, color2, smoothMix);
      }
    `,
    side: THREE.BackSide
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[20, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export default SkyGallery; 