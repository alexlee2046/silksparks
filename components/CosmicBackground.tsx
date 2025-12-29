import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Sparkles, Float } from "@react-three/drei";
import * as THREE from "three";

const ParticleField = () => {
  const mesh = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      mesh.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group>
      <Sparkles
        count={200}
        scale={12}
        size={3}
        speed={0.4}
        opacity={0.6}
        color="#f4c025" // Primary gold
      />
      <Sparkles
        count={150}
        scale={15}
        size={5}
        speed={0.3}
        opacity={0.4}
        color="#e0af1f"
      />
      <Sparkles
        count={100}
        scale={10}
        size={2}
        speed={0.2}
        opacity={0.3}
        color="#ffffff"
      />
    </group>
  );
};

const BackgroundContent = () => {
  return (
    <>
      <color attach="background" args={["#181611"]} />
      <fog attach="fog" args={["#181611", 5, 20]} />

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <ParticleField />
      </Float>

      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
    </>
  );
};

export const CosmicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={[1, 2]} // Optimize pixel ratio
        gl={{ antialias: true, alpha: false }}
      >
        <BackgroundContent />
      </Canvas>
      {/* Overlay gradient to ensure text readability and create depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-background-dark/30 via-transparent to-background-dark/80" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
    </div>
  );
};
