/**
 * AuthContext - 纯粹的认证状态管理
 * 职责: 只管理 session 和认证状态
 *
 * 从 UserContext 分离出来，遵循单一职责原则
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";

// ============ Types ============

interface AuthContextType {
  /** 当前 Supabase session */
  session: Session | null;
  /** 当前用户 (来自 session) */
  user: User | null;
  /** 是否正在加载认证状态 */
  loading: boolean;
  /** 是否已登录 */
  isAuthenticated: boolean;
  /** 登出 */
  signOut: () => Promise<void>;
  /** 刷新 session */
  refreshSession: () => Promise<void>;
}

// ============ Context ============

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============ Provider ============

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化 session
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthContext] Error getting session:", error);
        }

        if (mounted) {
          setSession(session);
          setLoading(false);
        }
      } catch (err) {
        console.error("[AuthContext] Unexpected error:", err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        if (!mounted) return;

        console.log(`[AuthContext] Auth event: ${event}`);
        setSession(newSession);

        // 处理特殊事件
        if (event === "SIGNED_OUT") {
          setSession(null);
        } else if (event === "TOKEN_REFRESHED") {
          console.log("[AuthContext] Token refreshed");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 登出
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[AuthContext] Sign out error:", error);
        throw error;
      }
      setSession(null);
    } catch (err) {
      console.error("[AuthContext] Sign out failed:", err);
      throw err;
    }
  }, []);

  // 刷新 session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("[AuthContext] Refresh session error:", error);
        throw error;
      }
      setSession(newSession);
    } catch (err) {
      console.error("[AuthContext] Refresh session failed:", err);
      throw err;
    }
  }, []);

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    loading,
    isAuthenticated: !!session,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============ Hook ============

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ============ Utilities ============

/**
 * 检查用户是否已登录 (非阻塞)
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * 获取当前用户 ID (如果已登录)
 */
export function useUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}
