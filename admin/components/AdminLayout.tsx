import React, { useEffect, useRef } from "react";
import { useMenu, useGo, useLogout } from "@refinedev/core";
import { GlassCard } from "../../components/GlassCard";
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Lenis from "lenis";

export const AdminLayout: React.FC = () => {
  const { menuItems, selectedKey } = useMenu();
  const go = useGo();
  const { mutate: logout } = useLogout();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    <div className="flex-1 bg-background min-h-screen relative overflow-hidden flex flex-col md:flex-row">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar - Fixed on desktop to not scroll with content */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-64 p-4 md:p-6 z-20 flex flex-col gap-6 md:h-screen md:sticky md:top-0"
      >
        <div className="px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
            <span className="material-symbols-outlined text-[14px]">
              shield_person
            </span>{" "}
            Admin
          </div>
          <h1 className="text-2xl font-display font-light text-foreground tracking-tight">
            Silk &{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
              Spark
            </span>
          </h1>
        </div>

        <GlassCard
          className="flex-1 p-4 border-surface-border flex flex-col"
          intensity="low"
        >
          <nav className="space-y-2 overflow-y-auto no-scrollbar flex-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => go({ to: item.route ?? "" })}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold w-full text-left rounded-lg transition-all duration-300 group ${
                  selectedKey === item.key
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(244,192,37,0.1)]"
                    : "text-text-muted hover:bg-surface-border/30 hover:text-foreground border border-transparent"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${selectedKey === item.key ? "scale-110" : "group-hover:scale-110"}`}
                >
                  {item.meta?.icon ?? "circle"}
                </span>
                <span className="tracking-wide uppercase">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-surface-border">
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold w-full text-left rounded-lg text-text-muted hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300"
            >
              <span className="material-symbols-outlined text-[18px]">
                logout
              </span>
              <span className="tracking-wide uppercase">Logout</span>
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-10 relative z-10 w-full min-w-0">
        <Outlet />
      </div>
    </div>
  );
};
