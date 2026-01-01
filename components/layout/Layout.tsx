import React, { useEffect } from "react";
import Lenis from "lenis";
import { CosmicBackground } from "../CosmicBackground";
import { Header } from "./Header";
import { Footer } from "./Footer";

export interface LayoutProps {
  children: React.ReactNode;
  type?: "public" | "user" | "admin";
  onAuthClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  type = "public",
  onAuthClick,
}) => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      lerp: 0.15,
      wheelMultiplier: 1.2,
      touchMultiplier: 1.5,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background font-display text-foreground relative isolate">
      <CosmicBackground />
      <Header type={type} onAuthClick={onAuthClick} />
      <main id="main-content" className="flex-1 z-10 relative">
        {children}
      </main>
      <Footer />
    </div>
  );
};
