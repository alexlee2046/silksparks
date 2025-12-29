import React from "react";
import { useMenu, useGo, useLogout } from "@refinedev/core";
import { GlassCard } from "../../components/GlassCard";
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";

export const AdminLayout: React.FC = () => {
  const { menuItems, selectedKey } = useMenu();
  const go = useGo();
  const { mutate: logout } = useLogout();

  return (
    <div className="flex-1 bg-background-dark min-h-screen relative overflow-hidden flex flex-col md:flex-row">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-64 p-4 md:p-6 z-10 flex flex-col gap-6"
      >
        <div className="px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
            <span className="material-symbols-outlined text-[14px]">
              shield_person
            </span>{" "}
            Admin
          </div>
          <h1 className="text-2xl font-display font-light text-white tracking-tight">
            Silk &{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
              Spark
            </span>
          </h1>
        </div>

        <GlassCard className="flex-1 p-4 border-white/5" intensity="low">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => go({ to: item.route ?? "" })}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold w-full text-left rounded-lg transition-all duration-300 group ${
                  selectedKey === item.key
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(244,192,37,0.1)]"
                    : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent"
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

          <div className="mt-auto pt-6 border-t border-white/5">
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold w-full text-left rounded-lg text-white/50 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300"
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
      <div className="flex-1 p-4 md:p-10 relative z-10 overflow-y-auto h-screen">
        <Outlet />
      </div>
    </div>
  );
};
