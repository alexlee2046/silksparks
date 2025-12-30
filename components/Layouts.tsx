import React, { useEffect, useState } from "react";
import { Screen } from "../types";
import Lenis from "lenis";
import { CosmicBackground } from "./CosmicBackground";
import { GlowButton } from "./GlowButton";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import { supabase } from "../services/supabase";

interface LayoutProps {
  children: React.ReactNode;
  setScreen: (screen: Screen) => void;
  type?: "public" | "user" | "admin";
  onAuthClick?: () => void;
}

const NotificationsDropdown = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      setNotifications(data || []);
      setLoading(false);
    };

    fetchNotifications();

    const channel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-12 right-0 w-80 bg-background-dark border border-white/10 rounded-xl shadow-2xl p-4 z-50"
    >
      <h3 className="text-white font-bold text-sm mb-3">Notifications</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-white/40">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-xs text-white/40">No new notifications.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="p-2 bg-white/5 rounded-lg">
              <p className="text-xs font-bold text-primary">{n.title}</p>
              <p className="text-xs text-white/70">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export const Header: React.FC<{
  setScreen: (s: Screen) => void;
  type?: "public" | "user" | "admin";
  onAuthClick?: () => void;
}> = ({ setScreen, type = "public", onAuthClick }) => {
  const { session, user, signOut } = useUser();
  const { itemCount, setIsCartOpen } = useCart();
  const [showNotifications, setShowNotifications] = useState(false);
  const userName =
    user?.name || session?.user?.email?.split("@")[0] || "Seeker";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background-dark/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background-dark/30 transition-all duration-500">
      <div className="flex justify-center px-4 md:px-10 py-4">
        <div className="flex w-full max-w-[1440px] items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 md:gap-4 text-white cursor-pointer group"
            onClick={() => setScreen(Screen.HOME)}
          >
            <div className="size-8 text-primary group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined !text-[32px]">
                auto_awesome
              </span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-white text-xl font-bold leading-tight tracking-tight hidden sm:block font-display">
                Silk & Spark
              </h2>
              {type === "admin" && (
                <span className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold">
                  Admin Console
                </span>
              )}
            </div>
          </div>

          {/* Nav Links based on type */}
          <nav className="hidden md:flex flex-1 justify-center gap-6 lg:gap-10">
            {type === "public" && (
              <>
                <div className="flex gap-8 border-r border-white/10 pr-10">
                  <HeaderLink onClick={() => setScreen(Screen.SHOP_LIST)}>
                    Shop
                  </HeaderLink>
                  <HeaderLink onClick={() => setScreen(Screen.EXPERTS)}>
                    Experts
                  </HeaderLink>
                </div>
                <div className="flex gap-8">
                  <HeaderLink onClick={() => setScreen(Screen.BIRTH_CHART)}>
                    Horoscope
                  </HeaderLink>
                  <HeaderLink onClick={() => setScreen(Screen.TAROT_DAILY)}>
                    Tarot
                  </HeaderLink>
                  <HeaderLink onClick={() => setScreen(Screen.TAROT_SPREAD)}>
                    AI Chat
                  </HeaderLink>
                </div>
              </>
            )}
            {type === "user" && (
              <div className="flex gap-10">
                <HeaderLink onClick={() => setScreen(Screen.USER_DASHBOARD)}>
                  Dashboard
                </HeaderLink>
                <HeaderLink onClick={() => setScreen(Screen.ARCHIVES)}>
                  Archives
                </HeaderLink>
                <HeaderLink onClick={() => setScreen(Screen.ORDERS)}>
                  Orders
                </HeaderLink>
              </div>
            )}
            {type === "admin" && (
              <div className="flex gap-10">
                <HeaderLink onClick={() => setScreen(Screen.ADMIN_PAYMENTS)}>
                  Payments
                </HeaderLink>
                <HeaderLink onClick={() => setScreen(Screen.ADMIN_CURRENCY)}>
                  Currency
                </HeaderLink>
                <HeaderLink onClick={() => setScreen(Screen.ADMIN_SHIPPING)}>
                  Shipping
                </HeaderLink>
              </div>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            {type === "public" && (
              <>
                <button className="text-white/40 hover:text-white transition-colors hidden sm:block">
                  <span className="material-symbols-outlined !text-[22px]">
                    search
                  </span>
                </button>
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setIsCartOpen(true)}
                >
                  <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors !text-[22px]">
                    shopping_bag
                  </span>
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-background-dark shadow-sm">
                      {itemCount}
                    </span>
                  )}
                </div>
                {session ? (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setScreen(Screen.USER_DASHBOARD)}
                      className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group hover:border-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        account_circle
                      </span>
                    </button>
                    <button
                      onClick={signOut}
                      className="text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <GlowButton
                    onClick={onAuthClick}
                    className="h-9 px-6 text-xs"
                  >
                    Login
                  </GlowButton>
                )}
              </>
            )}
            {(type === "user" || type === "admin") && (
              <div className="flex items-center gap-5 relative">
                <button
                  className="relative text-white/40 hover:text-white transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <span className="material-symbols-outlined !text-[22px]">
                    notifications
                  </span>
                  <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full border-2 border-background-dark"></span>
                </button>
                <AnimatePresence>
                  {showNotifications && session && (
                    <NotificationsDropdown userId={session.user.id} />
                  )}
                </AnimatePresence>

                <div
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:border-primary/40 transition-all group overflow-hidden relative"
                  onClick={() => setScreen(Screen.USER_DASHBOARD)}
                  title={userName}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={signOut}
                  className="text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider hidden sm:block"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const HeaderLink = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="text-white/40 hover:text-primary transition-all text-[11px] font-bold uppercase tracking-[0.15em] relative group py-2"
  >
    {children}
    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full"></span>
  </button>
);

export const Footer: React.FC<{ setScreen?: (s: Screen) => void }> = ({
  setScreen,
}) => (
  <footer className="bg-background-dark border-t border-white/5 pt-20 pb-10 text-white/40 relative z-10 overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

    <div className="max-w-[1440px] mx-auto px-6 md:px-10">
      <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-16 mb-20">
        {/* Brand Section */}
        <div className="col-span-2 md:col-span-4 space-y-8">
          <button
            onClick={() => setScreen?.(Screen.HOME)}
            className="flex items-center gap-3 text-white group"
          >
            <span className="material-symbols-outlined text-primary !text-[28px] group-hover:scale-110 transition-transform">
              auto_awesome
            </span>
            <span className="font-bold text-2xl font-display tracking-tight group-hover:text-primary transition-colors">
              Silk & Spark
            </span>
          </button>
          <p className="text-sm leading-relaxed max-w-sm font-light">
            Merging ancient celestial wisdom with cutting-edge intelligence to
            illuminate your path through the digital age.
          </p>
          <div className="flex gap-4">
            <SocialIcon icon="hub" />
            <SocialIcon icon="auto_fix" />
            <SocialIcon icon="public" />
          </div>
        </div>

        {/* The Spark - 占星/塔罗功能 */}
        <div className="md:col-span-2 space-y-5">
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[14px]">
              auto_awesome
            </span>{" "}
            The Spark
          </h4>
          <ul className="flex flex-col gap-3 text-xs font-medium">
            <FooterLink onClick={() => setScreen?.(Screen.BIRTH_CHART)}>
              Birth Chart
            </FooterLink>
            <FooterLink onClick={() => setScreen?.(Screen.REPORT)}>
              Astrology Report
            </FooterLink>
            <FooterLink onClick={() => setScreen?.(Screen.TAROT_DAILY)}>
              Daily Tarot
            </FooterLink>
            <FooterLink onClick={() => setScreen?.(Screen.TAROT_SPREAD)}>
              Tarot Spread
            </FooterLink>
          </ul>
        </div>

        {/* The Silk - 商店/咨询 */}
        <div className="md:col-span-2 space-y-5">
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[14px]">
              diamond
            </span>{" "}
            The Silk
          </h4>
          <ul className="flex flex-col gap-3 text-xs font-medium">
            <FooterLink onClick={() => setScreen?.(Screen.SHOP_LIST)}>
              Shop Artifacts
            </FooterLink>
            <FooterLink onClick={() => setScreen?.(Screen.EXPERTS)}>
              Expert Guides
            </FooterLink>
            <FooterLink onClick={() => setScreen?.(Screen.BOOKING)}>
              Book Session
            </FooterLink>
          </ul>
        </div>

        {/* My Space - 用户中心 */}
        <div className="md:col-span-2 space-y-5">
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[14px]">
              person
            </span>{" "}
            My Space
          </h4>
          <ul className="flex flex-col gap-3 text-xs font-medium">
            <FooterLink onClick={() => setScreen?.(Screen.USER_DASHBOARD)}>
              Dashboard
            </FooterLink>
            <FooterLink onClick={() => setScreen?.(Screen.ARCHIVES)}>
              Archives
            </FooterLink>
            <FooterLink onClick={() => setScreen?.(Screen.ORDERS)}>
              Order History
            </FooterLink>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="col-span-2 md:col-span-2 space-y-5">
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[14px]">
              mail
            </span>{" "}
            Newsletter
          </h4>
          <p className="text-xs leading-relaxed">
            Lunar updates & exclusive drops.
          </p>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="relative">
              <input
                type="email"
                placeholder="Your email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-primary/50 outline-none text-xs transition-all pr-11"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 bg-primary text-background-dark rounded-lg flex items-center justify-center hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
        <p className="text-white/20 italic">
          © 2025 Silk & Spark. Transcending the physical.
        </p>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Cookies
          </a>
          <button
            onClick={() => setScreen?.(Screen.ADMIN_PAYMENTS)}
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[10px]">
              shield_person
            </span>{" "}
            Admin
          </button>
        </div>
      </div>
    </div>
  </footer>
);

const SocialIcon = ({ icon }: { icon: string }) => (
  <a
    href="#"
    className="size-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/30 transition-all hover:-translate-y-1"
  >
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
  </a>
);

const FooterLink = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <li>
    <button
      onClick={onClick}
      className="hover:text-primary transition-all duration-300 flex items-center gap-2 group text-left"
    >
      <span className="w-0 h-[1px] bg-primary group-hover:w-3 transition-all duration-300"></span>
      {children}
    </button>
  </li>
);

export const Layout: React.FC<LayoutProps> = ({
  children,
  setScreen,
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
    <div className="flex min-h-screen flex-col bg-background-dark font-display text-white relative isolate">
      <CosmicBackground />
      <Header setScreen={setScreen} type={type} onAuthClick={onAuthClick} />
      <main className="flex-1 z-10 relative">{children}</main>
      <Footer setScreen={setScreen} />
    </div>
  );
};
