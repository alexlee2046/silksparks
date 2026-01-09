import React, { useState } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { GlowButton } from "./GlowButton";

interface AuthProps {
  onClose?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (onClose) onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;

        // For new users, create profile record if needed (though we should have a trigger in DB)
        // If there's no trigger yet, we can't do much here as Auth is separate from public.profiles

        setMessage("Check your email for the confirmation link!");
        setShowResend(true);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  // 重新发送确认邮件
  const handleResendConfirmation = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;

      setMessage("Confirmation email sent! Check your inbox and spam folder.");
      // 设置 60 秒冷却期
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to resend confirmation email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="absolute top-0 right-0 -mt-1 -mr-1 md:-mt-2 md:-mr-2 z-10">
          <button
            onClick={onClose}
            className="h-11 w-11 rounded-full bg-surface-border/30 border border-surface-border flex items-center justify-center text-text-muted hover:text-foreground hover:bg-surface-border/50 transition-all"
          >
            <span className="material-symbols-outlined !text-[22px]">close</span>
          </button>
        </div>

        <GlassCard className="p-6 md:p-10 border-surface-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-amber-600"></div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20 shadow-[0_0_20px_rgba(244,192,37,0.2)]">
              <span className="material-symbols-outlined text-4xl">
                auto_awesome
              </span>
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Join the Cosmos"}
            </h2>
            <p className="text-text-muted text-sm">
              {isLogin
                ? "Continue your celestial journey."
                : "Create your astral profile today."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surface-border/30 border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    placeholder="Arjun Sharma"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-border/30 border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                placeholder="seeker@silkspark.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-border/30 border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs text-center">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-xs text-center">
                {message}
                {showResend && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={loading || resendCooldown > 0}
                    className="block w-full mt-2 text-primary hover:text-primary-hover disabled:text-text-muted disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend confirmation email"}
                  </button>
                )}
              </div>
            )}

            <GlowButton
              type="submit"
              className="w-full py-4 rounded-xl font-bold text-lg mt-4"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
            </GlowButton>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-text-muted hover:text-primary transition-colors font-medium"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
