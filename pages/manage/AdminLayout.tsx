import React from "react";
import { motion } from "framer-motion";
import { PATHS } from "../../lib/paths";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";
import { AdminNavLink } from "./AdminNavLink";

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
  navigate: (path: string) => void;
  onSave?: () => void;
  loading?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  title,
  children,
  navigate,
  onSave,
  loading,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex-1 bg-background p-4 md:p-10 min-h-screen relative overflow-hidden"
  >
    {/* Background Decorative Element */}
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

    <div className="max-w-[1440px] mx-auto relative z-10">
      {/* Coming Soon Banner */}
      <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
        <span className="material-symbols-outlined text-amber-500 text-[24px]">
          construction
        </span>
        <div>
          <p className="text-amber-500 font-bold text-sm">管理后台开发中</p>
          <p className="text-text-muted text-xs">
            此功能尚在开发阶段，配置更改暂时无法保存。我们正在努力完善中。
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary">
            <span className="material-symbols-outlined text-[14px]">
              shield_person
            </span>{" "}
            Admin System
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-light text-foreground tracking-tight">
            {title.split(" ").map((word, i) => (
              <span
                key={i}
                className={
                  i === 0
                    ? "font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200 mr-3"
                    : "text-foreground"
                }
              >
                {word}{" "}
              </span>
            ))}
          </h1>
        </div>
        <div className="flex gap-4">
          <GlowButton
            variant="secondary"
            onClick={() => navigate(PATHS.HOME)}
            icon="home"
          >
            Exit Admin
          </GlowButton>
          <GlowButton
            variant="primary"
            icon="save"
            onClick={onSave}
            disabled={!onSave || loading}
            className={!onSave ? "opacity-50 cursor-not-allowed" : ""}
          >
            {loading ? "Saving..." : "Save Changes"}
          </GlowButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <GlassCard
            className="p-6 sticky top-24 border-surface-border"
            intensity="low"
          >
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-6 px-2">
              Control Panel
            </h3>
            <nav className="flex flex-col space-y-2">
              <AdminNavLink
                active={title === "Payment Configuration"}
                onClick={() => navigate(PATHS.MANAGE_PAYMENTS)}
                icon="payments"
                label="Payments"
              />
              <AdminNavLink
                active={title === "Currency & Localization"}
                onClick={() => navigate(PATHS.MANAGE_CURRENCY)}
                icon="currency_exchange"
                label="Currency"
              />
              <AdminNavLink
                active={title === "Shipping Rate Templates"}
                onClick={() => navigate(PATHS.MANAGE_SHIPPING)}
                icon="local_shipping"
                label="Shipping"
              />
              <AdminNavLink
                active={title === "System Intelligence"}
                onClick={() => navigate(PATHS.MANAGE_SETTINGS)}
                icon="psychology"
                label="AI Config"
              />
            </nav>

            <div className="mt-10 pt-6 border-t border-surface-border">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">
                  System Status
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-foreground font-bold text-xs">
                    All Systems Operational
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-9 space-y-8"
        >
          {children}
        </motion.div>
      </div>
    </div>
  </motion.div>
);
