import React, { useEffect, useMemo } from "react";
import { useMenu, useGo, useLogout } from "@refinedev/core";
import { GlassCard } from "../../components/GlassCard";
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Lenis from "lenis";

// 分组配置
const GROUP_CONFIG: Record<string, { label: string; icon: string }> = {
  overview: { label: "Overview", icon: "space_dashboard" },
  catalog: { label: "Catalog", icon: "storefront" },
  services: { label: "Services", icon: "support_agent" },
  commerce: { label: "Commerce", icon: "shopping_cart" },
  users: { label: "Users", icon: "people" },
  system: { label: "System", icon: "admin_panel_settings" },
};

const GROUP_ORDER = ["overview", "catalog", "services", "commerce", "users", "system"];

export const AdminLayout: React.FC = () => {
  const { menuItems, selectedKey } = useMenu();
  const go = useGo();
  const { mutate: logout } = useLogout();

  // 按分组整理菜单项
  const groupedMenuItems = useMemo(() => {
    const groups: Record<string, typeof menuItems> = {};

    menuItems.forEach((item) => {
      const group = (item.meta?.group as string) || "other";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
    });

    return groups;
  }, [menuItems]);

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

      {/* Sidebar - Fixed on desktop with scrollable nav */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-64 p-4 md:p-6 z-20 flex flex-col gap-6 md:h-screen md:sticky md:top-0 md:max-h-screen overflow-hidden"
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
          className="flex-1 p-3 border-surface-border flex flex-col min-h-0 overflow-hidden"
          intensity="low"
        >
          {/* 使用 data-lenis-prevent 阻止 Lenis 干扰侧边栏滚动 */}
          <nav
            className="flex-1 overflow-y-auto overscroll-contain pr-1 sidebar-scroll"
            data-lenis-prevent
          >
            {GROUP_ORDER.map((groupKey) => {
              const items = groupedMenuItems[groupKey];
              if (!items || items.length === 0) return null;

              const groupConfig = GROUP_CONFIG[groupKey];

              return (
                <div key={groupKey} className="mb-4">
                  {/* 分组标题 */}
                  <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                    <span className="material-symbols-outlined text-[14px] text-text-muted/60">
                      {groupConfig?.icon || "folder"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
                      {groupConfig?.label || groupKey}
                    </span>
                  </div>

                  {/* 分组内的菜单项 */}
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => go({ to: item.route ?? "" })}
                        className={`flex items-center gap-3 px-3 py-2 text-xs font-medium w-full text-left rounded-lg transition-all duration-200 group ${
                          selectedKey === item.key
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(244,192,37,0.1)]"
                            : "text-text-muted hover:bg-surface-border/30 hover:text-foreground border border-transparent"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${selectedKey === item.key ? "scale-110" : "group-hover:scale-105"}`}
                        >
                          {item.meta?.icon ?? "circle"}
                        </span>
                        <span className="tracking-wide">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* 登出按钮 */}
          <div className="pt-3 border-t border-surface-border mt-auto">
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium w-full text-left rounded-lg text-text-muted hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[18px]">
                logout
              </span>
              <span className="tracking-wide">Logout</span>
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-10 relative z-10 w-full min-w-0">
        <Outlet />
      </div>

      {/* 侧边栏滚动条样式 */}
      <style>{`
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(244, 192, 37, 0.3) transparent;
        }
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(244, 192, 37, 0.3);
          border-radius: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(244, 192, 37, 0.5);
        }
      `}</style>
    </div>
  );
};
