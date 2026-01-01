import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import * as m from "../../src/paraglide/messages";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  type: "public" | "user" | "admin";
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick: () => void;
  icon?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, onClick, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-text-muted hover:text-foreground hover:bg-surface-border/30"
      }`}
    >
      {icon && (
        <span className="material-symbols-outlined !text-[22px]" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="text-sm font-medium tracking-wide">{children}</span>
    </Link>
  );
};

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, type }) => {
  const { session, user, signOut } = useUser();
  const userName = user?.name || session?.user?.email?.split("@")[0] || m["user.defaultName"]();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-full max-w-xs bg-background border-r border-surface-border shadow-2xl z-[70] flex flex-col"
            aria-label="Mobile navigation"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary !text-[28px]">
                  auto_awesome
                </span>
                <span className="font-display font-bold text-lg text-foreground">
                  {m["common.appName"]()}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label={m["accessibility.closeMenu"]()}
                className="h-11 w-11 flex items-center justify-center rounded-xl text-text-muted hover:text-foreground hover:bg-surface-border/30 transition-colors"
              >
                <span className="material-symbols-outlined !text-[24px]">close</span>
              </button>
            </div>

            {/* User Info (when authenticated) */}
            {session && (
              <div className="p-4 border-b border-surface-border bg-surface-border/10">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 border border-surface-border flex items-center justify-center text-lg font-bold text-foreground">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                    <p className="text-xs text-text-muted truncate">{session.user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {type === "public" && (
                <>
                  <NavLink to="/" onClick={onClose} icon="home">
                    {m["nav.home"]()}
                  </NavLink>
                  <NavLink to="/shop" onClick={onClose} icon="shopping_bag">
                    {m["nav.shop"]()}
                  </NavLink>
                  <NavLink to="/experts" onClick={onClose} icon="groups">
                    {m["nav.experts"]()}
                  </NavLink>

                  <div className="my-4 border-t border-surface-border" />

                  <NavLink to="/horoscope" onClick={onClose} icon="sunny">
                    {m["nav.horoscope"]()}
                  </NavLink>
                  <NavLink to="/tarot" onClick={onClose} icon="style">
                    {m["nav.tarot"]()}
                  </NavLink>
                  <NavLink to="/tarot/spread" onClick={onClose} icon="chat">
                    {m["nav.aiChat"]()}
                  </NavLink>
                </>
              )}

              {type === "user" && (
                <>
                  <NavLink to="/dashboard" onClick={onClose} icon="dashboard">
                    {m["nav.dashboard"]()}
                  </NavLink>
                  <NavLink to="/dashboard/archives" onClick={onClose} icon="folder_open">
                    {m["nav.archives"]()}
                  </NavLink>
                  <NavLink to="/dashboard/orders" onClick={onClose} icon="receipt_long">
                    {m["nav.orders"]()}
                  </NavLink>
                  <NavLink to="/dashboard/consultations" onClick={onClose} icon="calendar_month">
                    {m["nav.consultations"]()}
                  </NavLink>
                  <NavLink to="/dashboard/settings" onClick={onClose} icon="settings">
                    {m["nav.settings"]()}
                  </NavLink>
                </>
              )}

              {type === "admin" && (
                <>
                  <NavLink to="/manage/payments" onClick={onClose} icon="payments">
                    Payments
                  </NavLink>
                  <NavLink to="/manage/currency" onClick={onClose} icon="currency_exchange">
                    Currency
                  </NavLink>
                  <NavLink to="/manage/shipping" onClick={onClose} icon="local_shipping">
                    Shipping
                  </NavLink>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-surface-border space-y-2">
              {session ? (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-text-muted hover:text-foreground hover:bg-surface-border/30 transition-colors"
                >
                  <span className="material-symbols-outlined !text-[20px]">logout</span>
                  <span className="text-sm font-medium">{m["common.signOut"]()}</span>
                </button>
              ) : (
                <Link
                  to="/"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-background-dark font-medium transition-colors hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined !text-[20px]">login</span>
                  <span className="text-sm">{m["common.signIn"]()}</span>
                </Link>
              )}
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
};
