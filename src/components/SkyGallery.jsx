import React, { useRef, useEffect, useMemo } from 'react';
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
  return `/images/day_${imageNumber}.jpeg`;
};

// Custom shader material for artistic effects
const SkyShaderMaterial = shaderMaterial(
  {
    map: null,
    time: 0,
    distortionIntensity: 0.2,
    colorShift: 0.1,
    dayIndex: 0
  },
  // Vertex shader
  `
    varying vec2 vUv;
    uniform float time;
    uniform float distortionIntensity;
    uniform float dayIndex;
    
    void main() {
      vUv = uv;
      
      // Add subtle vertex displacement based on time
      vec3 pos = position;
      float displacement = sin(position.x * 5.0 + time) * sin(position.y * 5.0 + time) * sin(position.z * 5.0 + time);
      pos += normal * displacement * distortionIntensity * 0.1;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
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
      // Distort UVs for a dreamy effect
      vec2 uv = vUv;
      float distortion = sin(uv.y * 10.0 + time * 0.5) * 0.01;
      uv.x += distortion;
      
      // Sample the texture with distorted UVs
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
  
  // Load the current day's texture
  const texture = useTexture(getImagePath(currentDay));
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
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
    }
    
    if (meshRef.current) {
      // Gentle continuous rotation
      meshRef.current.rotation.y += delta * 0.05;
    }
  });
  
  return (
    <group>
      {/* Background environment sphere with custom shader */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[10, 64, 64]} />
        <skyShaderMaterial 
          ref={materialRef}
          map={texture} 
          side={THREE.BackSide}
          transparent={true}
          distortionIntensity={0.2}
          colorShift={0.1}
          dayIndex={currentDay}
        />
      </mesh>
      
      {/* Floating particles to add depth */}
      <Particles count={300} currentDay={currentDay} />
    </group>
  );
};

// Enhanced particle system component
const Particles = ({ count, currentDay }) => {
  const mesh = useRef();
  const { viewport, clock } = useThree();
  
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
      
      temp.push({ 
        factor, 
        speed, 
        xFactor, 
        yFactor, 
        zFactor, 
        mx: 0, 
        my: 0,
        size,
        opacity
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
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      scales[i] = particles[i].size;
      opacities[i] = particles[i].opacity;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    return geometry;
  }, [count, particles]);
  
  // Animate particles
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    particles.forEach((particle, i) => {
      let { factor, speed, xFactor, yFactor, zFactor } = particle;
      
      // Create more complex movement patterns
      const x = (Math.cos(time / 10 * factor) + Math.sin(time / 10 * factor)) * xFactor;
      const y = (Math.sin(time / 10 * factor) + Math.cos(time / 10 * factor)) * yFactor;
      const z = (Math.cos(time / 10 * factor) + Math.sin(time / 10 * factor)) * zFactor;
      
      // Add a subtle pulsing effect
      const scale = particle.size * (1 + Math.sin(time * speed * 5) * 0.2);
      
      dummy.position.set(x, y, z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[0.05, 10, 10]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </instancedMesh>
  );
};

export default SkyGallery; 