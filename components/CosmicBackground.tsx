import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Sparkles, Float } from "@react-three/drei";
import { useTheme } from "../context/ThemeContext";
import { usePerformance, QualityLevel } from "../context/PerformanceContext";

// Theme-aware color configurations
const THEME_COLORS = {
  dark: {
    background: "#181611",
    fog: "#181611",
    sparkleGold: "#f4c025",
    sparkleSecondary: "#e0af1f",
    sparkleWhite: "#ffffff",
    starsOpacity: 1,
  },
  light: {
    background: "#f5f0e8",
    fog: "#ebe5db",
    sparkleGold: "#c49a0a",
    sparkleSecondary: "#a88508",
    sparkleWhite: "#8b8578",
    starsOpacity: 0.3,
  },
};

interface ParticleFieldProps {
  colors: typeof THEME_COLORS.dark;
  sparkleCount: number;
}

const ParticleField: React.FC<ParticleFieldProps> = ({ colors, sparkleCount }) => {
  const mesh = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      mesh.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  // Scale sparkle counts proportionally
  const counts = useMemo(() => ({
    gold: Math.round(sparkleCount * 0.44),      // ~200 at high
    secondary: Math.round(sparkleCount * 0.33), // ~150 at high
    white: Math.round(sparkleCount * 0.22),     // ~100 at high
  }), [sparkleCount]);

  return (
    <group>
      <Sparkles
        count={counts.gold}
        scale={12}
        size={3}
        speed={0.4}
        opacity={0.6}
        color={colors.sparkleGold}
      />
      <Sparkles
        count={counts.secondary}
        scale={15}
        size={5}
        speed={0.3}
        opacity={0.4}
        color={colors.sparkleSecondary}
      />
      <Sparkles
        count={counts.white}
        scale={10}
        size={2}
        speed={0.2}
        opacity={0.3}
        color={colors.sparkleWhite}
      />
    </group>
  );
};

interface BackgroundContentProps {
  colors: typeof THEME_COLORS.dark;
  settings: {
    stars: number;
    sparkles: number;
    enableSparkles: boolean;
    enableFloat: boolean;
    enableFog: boolean;
  };
}

const BackgroundContent: React.FC<BackgroundContentProps> = ({ colors, settings }) => {
  const particleField = settings.enableSparkles ? (
    <ParticleField colors={colors} sparkleCount={settings.sparkles} />
  ) : null;

  return (
    <>
      <color attach="background" args={[colors.background]} />
      {settings.enableFog && <fog attach="fog" args={[colors.fog, 5, 20]} />}

      {settings.enableFloat ? (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          {particleField}
        </Float>
      ) : (
        particleField
      )}

      {settings.stars > 0 && (
        <Stars
          radius={100}
          depth={50}
          count={settings.stars}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
      )}
    </>
  );
};

// Fallback gradient for when 3D is disabled
const StaticBackground: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div
    className="fixed inset-0 z-[-1] pointer-events-none transition-colors duration-500"
    style={{
      background: isDark
        ? "radial-gradient(ellipse at 50% 0%, #27241b 0%, #181611 50%, #0a0908 100%)"
        : "radial-gradient(ellipse at 50% 0%, #f5f0e8 0%, #ebe5db 50%, #e0d9cc 100%)",
    }}
  >
    {/* Subtle star pattern for light mode */}
    {!isDark && (
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(180, 140, 30, 0.3) 0%, transparent 1%),
                           radial-gradient(circle at 80% 70%, rgba(180, 140, 30, 0.2) 0%, transparent 1%),
                           radial-gradient(circle at 50% 50%, rgba(180, 140, 30, 0.15) 0%, transparent 0.5%)`,
          backgroundSize: "150px 150px, 200px 200px, 100px 100px",
        }}
      />
    )}
  </div>
);

export const CosmicBackground: React.FC = () => {
  // Use try-catch to handle cases where providers aren't mounted yet
  let resolvedTheme: "light" | "dark" = "dark";
  let qualityLevel: QualityLevel = "high";
  let settings = {
    stars: 5000,
    sparkles: 450,
    enableSparkles: true,
    enableFloat: true,
    enableFog: true,
    dpr: [1, 2] as [number, number],
  };

  try {
    const theme = useTheme();
    resolvedTheme = theme.resolvedTheme;
  } catch {
    // ThemeProvider not mounted, use default
  }

  try {
    const performance = usePerformance();
    qualityLevel = performance.qualityLevel;
    settings = performance.settings;
  } catch {
    // PerformanceProvider not mounted, use default
  }

  const colors = THEME_COLORS[resolvedTheme];

  // Render static background when quality is "off"
  if (qualityLevel === "off") {
    return <StaticBackground isDark={resolvedTheme === "dark"} />;
  }

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={settings.dpr}
        gl={{ antialias: qualityLevel === "high", alpha: false }}
      >
        <BackgroundContent colors={colors} settings={settings} />
      </Canvas>
      {/* Overlay gradient to ensure text readability and create depth */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: resolvedTheme === "dark"
            ? "linear-gradient(to bottom, rgba(24, 22, 17, 0.3), transparent, rgba(24, 22, 17, 0.8))"
            : "linear-gradient(to bottom, rgba(250, 248, 245, 0.3), transparent, rgba(250, 248, 245, 0.8))",
        }}
      />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
    </div>
  );
};
