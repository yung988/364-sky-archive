import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, shaderMaterial, useAspect } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { extend } from '@react-three/fiber';

// Helper function to get image path based on day index
const getImagePath = (dayIndex) => {
  // Since we only have 8 images, we'll cycle through them
  const availableImages = 8;
  const imageNumber = (dayIndex % availableImages) + 1;
  
  // Try both formats to ensure compatibility
  const path = `/images/day_${imageNumber}.JPG`;
  console.log("Loading image from path:", path);
  return path;
};

// Enhanced custom shader material for artistic effects
const EnhancedSkyShaderMaterial = shaderMaterial(
  {
    map: null,
    time: 0,
    distortionIntensity: 0.2,
    colorShift: 0.1,
    dayIndex: 0,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    mousePosition: new THREE.Vector2(0.5, 0.5),
    transitionProgress: 0.0,
    prevMap: null
  },
  // Vertex shader
  `
    varying vec2 vUv;
    uniform float time;
    uniform float distortionIntensity;
    uniform float dayIndex;
    uniform vec2 mousePosition;
    
    void main() {
      vUv = uv;
      
      // Add more complex vertex displacement based on time and mouse position
      vec3 pos = position;
      
      // Create ripple effect from mouse position
      float dist = distance(uv, mousePosition);
      float ripple = sin(dist * 20.0 - time * 2.0) * 0.05;
      
      // Add breathing effect
      float breathing = sin(time * 0.5) * 0.05;
      
      // Add wave displacement
      float displacement = sin(position.x * 5.0 + time) * sin(position.y * 5.0 + time) * sin(position.z * 5.0 + time);
      
      // Combine effects
      pos += normal * (displacement * distortionIntensity * 0.1 + ripple + breathing);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    varying vec2 vUv;
    uniform sampler2D map;
    uniform sampler2D prevMap;
    uniform float time;
    uniform float colorShift;
    uniform float dayIndex;
    uniform vec2 resolution;
    uniform vec2 mousePosition;
    uniform float transitionProgress;
    
    // Noise function for more organic effects
    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u * u * (3.0 - 2.0 * u);
      
      float res = mix(
        mix(sin(dot(ip, vec2(13.9898, 8.233)) * 43758.5453),
            sin(dot(ip + vec2(1.0, 0.0), vec2(13.9898, 8.233)) * 43758.5453), u.x),
        mix(sin(dot(ip + vec2(0.0, 1.0), vec2(13.9898, 8.233)) * 43758.5453),
            sin(dot(ip + vec2(1.0, 1.0), vec2(13.9898, 8.233)) * 43758.5453), u.x), u.y);
      return res * 0.5 + 0.5;
    }
    
    void main() {
      // Create more complex UV distortion
      vec2 uv = vUv;
      
      // Mouse-influenced distortion
      float mouseInfluence = 0.02 * (1.0 - distance(uv, mousePosition));
      
      // Time-based flowing distortion
      float distortion = sin(uv.y * 10.0 + time * 0.5) * 0.01;
      float distortion2 = cos(uv.x * 8.0 - time * 0.3) * 0.01;
      
      // Apply distortions
      uv.x += distortion + distortion2 + mouseInfluence * sin(time);
      uv.y += distortion * 0.5 + mouseInfluence * cos(time * 0.7);
      
      // Create chromatic aberration effect
      float aberration = 0.01 * (1.0 + sin(time * 0.3));
      vec4 colorR = texture2D(map, uv + vec2(aberration, 0.0));
      vec4 colorG = texture2D(map, uv);
      vec4 colorB = texture2D(map, uv - vec2(aberration, 0.0));
      
      // Create base color with chromatic aberration
      vec4 color = vec4(colorR.r, colorG.g, colorB.b, 1.0);
      
      // Add a subtle color shift based on day index
      float dayFactor = mod(dayIndex, 364.0) / 364.0;
      float r = color.r + sin(dayFactor * 3.14159 * 2.0) * colorShift;
      float g = color.g + sin(dayFactor * 3.14159 * 2.0 + 2.0) * colorShift;
      float b = color.b + sin(dayFactor * 3.14159 * 2.0 + 4.0) * colorShift;
      
      // Add a more complex vignette effect
      float vignette = 1.0 - smoothstep(0.4, 1.4, length(vUv - 0.5) * (1.5 + sin(time * 0.2) * 0.1));
      vignette = pow(vignette, 1.5);
      
      // Add subtle noise texture
      float noiseValue = noise(uv * 10.0 + time * 0.1) * 0.1;
      
      // Add subtle glow around mouse position
      float glow = 0.1 / (distance(uv, mousePosition) + 0.1);
      
      // Handle transition between images if needed
      if (transitionProgress > 0.0 && prevMap != map) {
        vec4 prevColor = texture2D(prevMap, uv);
        // Create a directional wipe transition
        float wipe = step(uv.x, transitionProgress);
        color = mix(prevColor, color, wipe);
      }
      
      // Combine all effects
      gl_FragColor = vec4(
        (r + noiseValue + glow * 0.1) * vignette, 
        (g + noiseValue + glow * 0.05) * vignette, 
        (b + noiseValue + glow * 0.2) * vignette, 
        1.0
      );
    }
  `
);

// Extend Three Fiber with our custom material
extend({ EnhancedSkyShaderMaterial });

const SkyGallery = ({ currentDay, totalDays }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const { viewport, clock, mouse, size } = useThree();
  const [prevDay, setPrevDay] = useState(currentDay);
  const [prevTexture, setPrevTexture] = useState(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
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
      console.log("Texture format:", texture.format);
    }
  }, [texture]);
  
  // Handle texture transition when day changes
  useEffect(() => {
    if (currentDay !== prevDay) {
      // Store previous texture for transition
      setPrevTexture(texture);
      setPrevDay(currentDay);
      
      // Animate transition
      const obj = { progress: 0 };
      gsap.to(obj, { 
        progress: 1, 
        duration: 1.2, 
        ease: "power2.inOut",
        onUpdate: () => {
          setTransitionProgress(obj.progress);
        },
        onComplete: () => {
          setTransitionProgress(0);
        }
      });
    }
  }, [currentDay, prevDay, texture]);
  
  // Animation effect when day changes
  useEffect(() => {
    if (meshRef.current) {
      // Create a timeline for the animation
      const tl = gsap.timeline();
      
      // Animate the mesh
      tl.to(meshRef.current.rotation, {
        y: meshRef.current.rotation.y + Math.PI * 2,
        duration: 1.5,
        ease: "power2.inOut"
      });
      
      // Animate distortion intensity for transition effect
      if (materialRef.current) {
        tl.fromTo(materialRef.current.uniforms.distortionIntensity, 
          { value: 0.8 },
          { value: 0.2, duration: 2, ease: "power2.out" },
          0
        );
      }
    }
  }, [currentDay]);
  
  // Update shader uniforms on each frame
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.dayIndex.value = currentDay;
      materialRef.current.uniforms.resolution.value.set(size.width, size.height);
      
      // Update mouse position for interactive effects
      const mouseX = (mouse.x + 1) / 2; // Convert from [-1, 1] to [0, 1]
      const mouseY = (mouse.y + 1) / 2;
      materialRef.current.uniforms.mousePosition.value.set(mouseX, mouseY);
      
      // Update transition progress
      materialRef.current.uniforms.transitionProgress.value = transitionProgress;
      
      // Update previous texture if available
      if (prevTexture) {
        materialRef.current.uniforms.prevMap.value = prevTexture;
      }
    }
    
    if (meshRef.current) {
      // Gentle continuous rotation
      meshRef.current.rotation.y += delta * 0.05;
      
      // Add subtle breathing effect
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.3) * 0.01;
      meshRef.current.scale.set(breathingScale, breathingScale, breathingScale);
    }
  });
  
  return (
    <group>
      {/* Background environment sphere with enhanced shader */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[10, 64, 64]} />
        {textureLoaded ? (
          <enhancedSkyShaderMaterial 
            ref={materialRef}
            map={texture} 
            prevMap={prevTexture || texture}
            side={THREE.BackSide}
            transparent={true}
            distortionIntensity={0.2}
            colorShift={0.1}
            dayIndex={currentDay}
            transitionProgress={transitionProgress}
          />
        ) : (
          // Fallback material while texture is loading
          <meshBasicMaterial 
            color="#000033" 
            side={THREE.BackSide}
            wireframe={true}
          />
        )}
      </mesh>
      
      {/* Add a simple sphere with basic texture for debugging */}
      <mesh position={[0, 0, -3]} scale={[1, 1, 1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          map={texture} 
          side={THREE.FrontSide}
        />
      </mesh>
      
      {/* Enhanced floating particles to add depth */}
      <EnhancedParticles count={500} currentDay={currentDay} />
      
      {/* Add light rays for dramatic effect */}
      <LightRays currentDay={currentDay} />
    </group>
  );
};

// Enhanced particle system component
const EnhancedParticles = ({ count, currentDay }) => {
  const mesh = useRef();
  const { viewport, clock, mouse } = useThree();
  
  // Create particles with properties influenced by the current day
  const particles = useMemo(() => {
    const temp = [];
    const dayFactor = currentDay / 364;
    
    for (let i = 0; i < count; i++) {
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      
      // Vary particle properties based on day
      const size = 0.02 + Math.random() * 0.08 + Math.sin(dayFactor * Math.PI * 2) * 0.02;
      const opacity = 0.2 + Math.random() * 0.6;
      
      // Add color variation
      const colorFactor = Math.random();
      const color = new THREE.Color();
      
      // Create color palette based on day index
      if (dayFactor < 0.25) { // Spring
        color.setHSL(0.2 + colorFactor * 0.2, 0.5, 0.7); // Green to yellow
      } else if (dayFactor < 0.5) { // Summer
        color.setHSL(0.1 + colorFactor * 0.1, 0.7, 0.7); // Yellow to orange
      } else if (dayFactor < 0.75) { // Fall
        color.setHSL(0.05 + colorFactor * 0.1, 0.8, 0.5); // Orange to red
      } else { // Winter
        color.setHSL(0.6 + colorFactor * 0.2, 0.3, 0.7); // Blue to purple
      }
      
      temp.push({ 
        factor, 
        speed, 
        xFactor, 
        yFactor, 
        zFactor, 
        mx: 0, 
        my: 0,
        size,
        opacity,
        color
      });
    }
    return temp;
  }, [count, currentDay]);
  
  // Particle positions and attributes
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const opacities = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      scales[i] = particles[i].size;
      opacities[i] = particles[i].opacity;
      
      // Set colors
      colors[i * 3] = particles[i].color.r;
      colors[i * 3 + 1] = particles[i].color.g;
      colors[i * 3 + 2] = particles[i].color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [count, particles]);
  
  // Animate particles
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const mouseX = mouse.x * viewport.width / 2;
    const mouseY = mouse.y * viewport.height / 2;
    
    particles.forEach((particle, i) => {
      let { factor, speed, xFactor, yFactor, zFactor } = particle;
      
      // Create more complex movement patterns
      const x = (Math.cos(time / 10 * factor) + Math.sin(time / 10 * factor)) * xFactor;
      const y = (Math.sin(time / 10 * factor) + Math.cos(time / 10 * factor)) * yFactor;
      const z = (Math.cos(time / 10 * factor) + Math.sin(time / 10 * factor)) * zFactor;
      
      // Add mouse influence - particles slightly attracted to mouse position
      const mouseInfluence = 0.5;
      const dx = mouseX - x;
      const dy = mouseY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Only affect particles within a certain range
      if (dist < 5) {
        const nx = x + (dx / dist) * mouseInfluence * delta;
        const ny = y + (dy / dist) * mouseInfluence * delta;
        dummy.position.set(nx, ny, z);
      } else {
        dummy.position.set(x, y, z);
      }
      
      // Add a subtle pulsing effect
      const scale = particle.size * (1 + Math.sin(time * speed * 5) * 0.2);
      
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[0.05, 10, 10]} />
      <meshBasicMaterial vertexColors transparent opacity={0.6} />
    </instancedMesh>
  );
};

// Light rays component for dramatic effect
const LightRays = ({ currentDay }) => {
  const groupRef = useRef();
  const { clock } = useThree();
  const dayFactor = currentDay / 364;
  
  // Create light rays based on season
  const rays = useMemo(() => {
    const temp = [];
    const count = 8;
    const radius = 8;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      // Vary ray properties based on season
      let intensity, color;
      
      if (dayFactor < 0.25) { // Spring
        intensity = 0.8 + Math.random() * 0.4;
        color = new THREE.Color(0.9, 1.0, 0.7);
      } else if (dayFactor < 0.5) { // Summer
        intensity = 1.0 + Math.random() * 0.5;
        color = new THREE.Color(1.0, 0.9, 0.6);
      } else if (dayFactor < 0.75) { // Fall
        intensity = 0.7 + Math.random() * 0.3;
        color = new THREE.Color(1.0, 0.7, 0.4);
      } else { // Winter
        intensity = 0.5 + Math.random() * 0.3;
        color = new THREE.Color(0.8, 0.9, 1.0);
      }
      
      temp.push({
        position: [x, (Math.random() - 0.5) * 4, y],
        intensity,
        color
      });
    }
    
    return temp;
  }, [dayFactor]);
  
  // Animate light rays
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      
      // Pulse the lights
      groupRef.current.children.forEach((light, i) => {
        const pulse = Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.2 + 0.8;
        light.intensity = rays[i].intensity * pulse;
      });
    }
  });
  
  return (
    <group ref={groupRef}>
      {rays.map((ray, i) => (
        <spotLight
          key={i}
          position={ray.position}
          intensity={ray.intensity}
          color={ray.color}
          distance={20}
          angle={0.2}
          penumbra={1}
          decay={1}
        />
      ))}
    </group>
  );
};

export default SkyGallery; 