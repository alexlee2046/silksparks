import React, { useEffect } from 'react';
import { Screen } from '../types';
import Lenis from 'lenis';
import { CosmicBackground } from './CosmicBackground';
import { GlowButton } from './GlowButton';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  setScreen: (screen: Screen) => void;
  type?: 'public' | 'user' | 'admin';
}

export const Header: React.FC<{ setScreen: (s: Screen) => void, type?: 'public' | 'user' | 'admin' }> = ({ setScreen, type = 'public' }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background-dark/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background-dark/30 transition-all duration-500">
      <div className="flex justify-center px-4 md:px-10 py-4">
        <div className="flex w-full max-w-[1440px] items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3 md:gap-4 text-white cursor-pointer group" onClick={() => setScreen(Screen.HOME)}>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse"></div>
              <div className="size-8 text-primary group-hover:scale-110 transition-transform duration-500 relative z-10">
                <span className="material-symbols-outlined !text-[32px]">auto_awesome</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-white text-xl font-bold leading-tight tracking-tight hidden sm:block font-display">Silk & Spark</h2>
              {type === 'admin' && <span className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold">Admin Console</span>}
            </div>
          </div>

          {/* Nav Links based on type */}
          <nav className="hidden md:flex flex-1 justify-center gap-6 lg:gap-10">
            {type === 'public' && (
              <>
                <div className="flex gap-8 border-r border-white/10 pr-10">
                  <HeaderLink onClick={() => setScreen(Screen.SHOP_LIST)}>Shop</HeaderLink>
                  <HeaderLink onClick={() => setScreen(Screen.EXPERTS)}>Experts</HeaderLink>
                </div>
                <div className="flex gap-8">
                  <HeaderLink onClick={() => setScreen(Screen.BIRTH_CHART)}>Horoscope</HeaderLink>
                  <HeaderLink onClick={() => setScreen(Screen.TAROT_DAILY)}>Tarot</HeaderLink>
                  <HeaderLink onClick={() => setScreen(Screen.TAROT_SPREAD)}>AI Chat</HeaderLink>
                </div>
              </>
            )}
            {type === 'user' && (
              <div className="flex gap-10">
                <HeaderLink onClick={() => setScreen(Screen.USER_DASHBOARD)}>Dashboard</HeaderLink>
                <HeaderLink onClick={() => setScreen(Screen.ARCHIVES)}>Archives</HeaderLink>
                <HeaderLink onClick={() => setScreen(Screen.ORDERS)}>Orders</HeaderLink>
              </div>
            )}
            {type === 'admin' && (
              <div className="flex gap-10">
                <HeaderLink onClick={() => setScreen(Screen.ADMIN_PAYMENTS)}>Payments</HeaderLink>
                <HeaderLink onClick={() => setScreen(Screen.ADMIN_CURRENCY)}>Currency</HeaderLink>
                <HeaderLink onClick={() => setScreen(Screen.ADMIN_SHIPPING)}>Shipping</HeaderLink>
              </div>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            {type === 'public' && (
              <>
                <button className="text-white/40 hover:text-white transition-colors hidden sm:block">
                  <span className="material-symbols-outlined !text-[22px]">search</span>
                </button>
                <div className="relative group cursor-pointer" onClick={() => setScreen(Screen.ORDERS)}>
                  <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors !text-[22px]">shopping_bag</span>
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-background-dark shadow-sm">2</span>
                </div>
                <GlowButton onClick={() => setScreen(Screen.USER_DASHBOARD)} className="h-9 px-6 text-xs">Login</GlowButton>
              </>
            )}
            {(type === 'user' || type === 'admin') && (
              <div className="flex items-center gap-5">
                <button className="relative text-white/40 hover:text-white transition-colors">
                  <span className="material-symbols-outlined !text-[22px]">notifications</span>
                  <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full border-2 border-background-dark"></span>
                </button>
                <div
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:border-primary/40 transition-all group overflow-hidden relative"
                  onClick={() => setScreen(Screen.HOME)}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  AL
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const HeaderLink = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-white/40 hover:text-primary transition-all text-[11px] font-bold uppercase tracking-[0.15em] relative group py-2"
  >
    {children}
    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full"></span>
  </button>
);

export const Footer: React.FC = () => (
  <footer className="bg-background-dark border-t border-white/5 pt-20 pb-10 text-white/40 relative z-10 overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

    <div className="max-w-[1440px] mx-auto px-6 md:px-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
        <div className="md:col-span-4 space-y-8">
          <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-primary !text-[28px]">auto_awesome</span>
            <span className="font-bold text-2xl font-display tracking-tight">Silk & Spark</span>
          </div>
          <p className="text-sm leading-relaxed max-w-sm font-light">
            Merging ancient celestial wisdom with cutting-edge intelligence to illuminate your path through the digital age.
          </p>
          <div className="flex gap-6">
            <SocialIcon icon="hub" />
            <SocialIcon icon="auto_fix" />
            <SocialIcon icon="public" />
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em]">The Spark</h4>
          <ul className="flex flex-col gap-4 text-xs font-medium">
            <FooterLink>Daily Horoscope</FooterLink>
            <FooterLink>Birth Chart Analysis</FooterLink>
            <FooterLink>AI Tarot Readings</FooterLink>
            <FooterLink>Cosmic Chat</FooterLink>
          </ul>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em]">The Silk</h4>
          <ul className="flex flex-col gap-4 text-xs font-medium">
            <FooterLink>New Artifacts</FooterLink>
            <FooterLink>Energy Crystals</FooterLink>
            <FooterLink>Tarot Decks</FooterLink>
            <FooterLink>Ritual Kits</FooterLink>
          </ul>
        </div>

        <div className="md:col-span-4 space-y-6">
          <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em]">Join the Inner Circle</h4>
          <p className="text-xs leading-relaxed max-w-xs">
            Subscribe to receive lunar updates and exclusive collection drops.
          </p>
          <form className="flex flex-col gap-3 mt-4">
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:border-primary/50 outline-none text-sm transition-all pr-12"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary text-background-dark rounded-lg flex items-center justify-center hover:bg-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
        <p className="text-white/20 italic">© 2025 Silk & Spark. Transcending the physical.</p>
        <div className="flex gap-10">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>
);

const SocialIcon = ({ icon }: { icon: string }) => (
  <a href="#" className="size-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/30 transition-all hover:-translate-y-1">
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
  </a>
)

const FooterLink = ({ children }: { children: React.ReactNode }) => (
  <li><a href="#" className="hover:text-primary transition-all duration-300 flex items-center gap-2 group">
    <span className="w-0 h-[1px] bg-primary group-hover:w-3 transition-all duration-300"></span>
    {children}
  </a></li>
)

export const Layout: React.FC<LayoutProps> = ({ children, setScreen, type = 'public' }) => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
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
      <Header setScreen={setScreen} type={type} />
      <main className="flex-1 z-10 relative">{children}</main>
      <Footer />
    </div>
  );
};