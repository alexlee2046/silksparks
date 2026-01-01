import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage, LOCALE_NAMES, type Locale } from "../../context/LanguageContext";
import { GlowButton } from "../GlowButton";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { MobileNav } from "./MobileNav";
import * as m from "../../src/paraglide/messages";

// Theme toggle button component
const ThemeToggle: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative h-10 w-10 md:h-8 md:w-8 rounded-lg bg-surface-border/30 hover:bg-surface-border/30 border border-surface-border hover:border-primary/30 flex items-center justify-center transition-all duration-300 overflow-hidden group"
    >
      <motion.span
        key={resolvedTheme}
        initial={{ y: -20, opacity: 0, rotate: -90 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        exit={{ y: 20, opacity: 0, rotate: 90 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="material-symbols-outlined !text-[18px] text-text-muted group-hover:text-primary transition-colors"
        aria-hidden="true"
      >
        {isDark ? "light_mode" : "dark_mode"}
      </motion.span>
    </button>
  );
};

// Language toggle button component
const LanguageToggle: React.FC = () => {
  const { locale, setLocale, locales } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const cycleLanguage = () => {
    const currentIndex = locales.indexOf(locale);
    const nextIndex = (currentIndex + 1) % locales.length;
    setLocale(locales[nextIndex] as Locale);
  };

  return (
    <div className="relative">
      <button
        onClick={cycleLanguage}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-label={`Current language: ${LOCALE_NAMES[locale].english}. Click to switch.`}
        className="relative h-10 md:h-8 px-3 md:px-2 rounded-lg bg-surface-border/30 hover:bg-surface-border/30 border border-surface-border hover:border-primary/30 flex items-center justify-center gap-1.5 transition-all duration-300 group"
      >
        <span className="material-symbols-outlined !text-[16px] text-text-muted group-hover:text-primary transition-colors" aria-hidden="true">
          translate
        </span>
        <span className="text-[11px] font-bold text-text-muted group-hover:text-primary transition-colors uppercase">
          {locale}
        </span>
      </button>

      {/* Dropdown for right-click */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 py-1 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-lg shadow-xl z-50 min-w-[120px]"
            >
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setLocale(loc as Locale);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    loc === locale
                      ? "text-primary bg-primary/10"
                      : "text-text-muted hover:text-foreground hover:bg-surface-border/30"
                  }`}
                >
                  {LOCALE_NAMES[loc as Locale].native}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

interface HeaderProps {
  type?: "public" | "user" | "admin";
  onAuthClick?: () => void;
}

const HeaderLink: React.FC<{
  children: React.ReactNode;
  to: string;
}> = ({ children, to }) => (
  <Link
    to={to}
    className="text-text-muted hover:text-primary transition-all text-[11px] font-bold uppercase tracking-[0.15em] relative group py-2"
  >
    {children}
    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full"></span>
  </Link>
);

export const Header: React.FC<HeaderProps> = ({
  type = "public",
  onAuthClick,
}) => {
  const navigate = useNavigate();
  const { session, user, signOut } = useUser();
  const { itemCount, setIsCartOpen } = useCart();
  const { locale } = useLanguage(); // Subscribe to locale changes for re-render
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // Using locale in key forces re-render when language changes
  void locale;
  const userName =
    user?.name || session?.user?.email?.split("@")[0] || m["user.defaultName"]();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-500">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-background-dark focus:rounded-lg focus:font-bold"
      >
        {m["accessibility.skipToContent"]()}
      </a>
      <div className="flex justify-center px-4 md:px-10 py-4">
        <div className="flex w-full max-w-[1440px] items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              aria-label={m["accessibility.openMenu"]()}
              className="md:hidden h-11 w-11 flex items-center justify-center rounded-xl text-text-muted hover:text-foreground hover:bg-surface-border/30 transition-colors -ml-2"
            >
              <span className="material-symbols-outlined !text-[24px]">menu</span>
            </button>

            {/* Logo */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Go to home page"
              className="flex items-center gap-3 md:gap-4 text-foreground cursor-pointer group"
              onClick={() => navigate("/")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/")}
          >
            <div className="size-8 text-primary group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined !text-[32px]">
                auto_awesome
              </span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-foreground text-xl font-bold leading-tight tracking-tight hidden sm:block font-display">
                {m["common.appName"]()}
              </h2>
              {type === "admin" && (
                <span className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold">
                  Admin Console
                </span>
              )}
            </div>
            </div>
          </div>

          {/* Nav Links based on type */}
          <nav className="hidden md:flex flex-1 justify-center gap-6 lg:gap-10">
            {type === "public" && (
              <>
                <div className="flex gap-8 border-r border-surface-border pr-10">
                  <HeaderLink to="/shop">{m["nav.shop"]()}</HeaderLink>
                  <HeaderLink to="/experts">{m["nav.experts"]()}</HeaderLink>
                </div>
                <div className="flex gap-8">
                  <HeaderLink to="/horoscope">{m["nav.horoscope"]()}</HeaderLink>
                  <HeaderLink to="/tarot">{m["nav.tarot"]()}</HeaderLink>
                  <HeaderLink to="/tarot/spread">{m["nav.aiChat"]()}</HeaderLink>
                </div>
              </>
            )}
            {type === "user" && (
              <div className="flex gap-10">
                <HeaderLink to="/dashboard">{m["nav.dashboard"]()}</HeaderLink>
                <HeaderLink to="/dashboard/archives">{m["nav.archives"]()}</HeaderLink>
                <HeaderLink to="/dashboard/orders">{m["nav.orders"]()}</HeaderLink>
              </div>
            )}
            {type === "admin" && (
              <div className="flex gap-10">
                <HeaderLink to="/manage/payments">Payments</HeaderLink>
                <HeaderLink to="/manage/currency">Currency</HeaderLink>
                <HeaderLink to="/manage/shipping">Shipping</HeaderLink>
              </div>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Language and Theme Toggle - always visible */}
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {type === "public" && (
              <>
                <button
                  aria-label="Search"
                  className="text-text-muted hover:text-foreground transition-colors hidden sm:block"
                >
                  <span
                    className="material-symbols-outlined !text-[22px]"
                    aria-hidden="true"
                  >
                    search
                  </span>
                </button>
                <button
                  aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
                  className="relative group cursor-pointer"
                  onClick={() => setIsCartOpen(true)}
                >
                  <span
                    className="material-symbols-outlined text-text-muted group-hover:text-foreground transition-colors !text-[22px]"
                    aria-hidden="true"
                  >
                    shopping_bag
                  </span>
                  {itemCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-background-dark shadow-sm"
                      aria-hidden="true"
                    >
                      {itemCount}
                    </span>
                  )}
                </button>
                {session ? (
                  <div className="flex items-center gap-4">
                    <button
                      aria-label="My account"
                      onClick={() => navigate("/dashboard")}
                      className="h-11 w-11 md:h-9 md:w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group hover:border-primary transition-all"
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        aria-hidden="true"
                      >
                        account_circle
                      </span>
                    </button>
                    <button
                      onClick={signOut}
                      className="text-text-muted hover:text-foreground transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      {m["common.signOut"]()}
                    </button>
                  </div>
                ) : (
                  <GlowButton
                    onClick={onAuthClick}
                    className="h-9 px-6 text-xs"
                  >
                    {m["common.signIn"]()}
                  </GlowButton>
                )}
              </>
            )}
            {(type === "user" || type === "admin") && (
              <div className="flex items-center gap-5 relative">
                <button
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  className="relative text-text-muted hover:text-foreground transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <span
                    className="material-symbols-outlined !text-[22px]"
                    aria-hidden="true"
                  >
                    notifications
                  </span>
                  <span
                    className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full border-2 border-background"
                    aria-hidden="true"
                  ></span>
                </button>
                <AnimatePresence>
                  {showNotifications && session && (
                    <NotificationsDropdown userId={session.user.id} />
                  )}
                </AnimatePresence>

                <button
                  aria-label={`User profile: ${userName}`}
                  className="h-11 w-11 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 border border-surface-border flex items-center justify-center text-sm md:text-xs font-bold text-foreground cursor-pointer hover:border-primary/40 transition-all group overflow-hidden relative"
                  onClick={() => navigate("/dashboard")}
                >
                  <div
                    className="absolute inset-0 bg-surface-border/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  ></div>
                  {userName.charAt(0).toUpperCase()}
                </button>
                <button
                  onClick={signOut}
                  className="text-text-muted hover:text-foreground transition-colors text-xs font-bold uppercase tracking-wider hidden sm:block"
                >
                  {m["common.signOut"]()}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        type={type}
      />
    </header>
  );
};
