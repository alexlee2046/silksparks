/**
 * ProfileContext - 用户资料状态管理
 * 职责: 用户名、邮箱、出生数据、积分、等级、管理员状态
 *
 * 从 UserContext 分离出来，遵循单一职责原则
 * 依赖 AuthContext 获取当前用户 ID
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "./AuthContext";

// ============ Types ============

export interface UserLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface UserBirthData {
  date: Date | null;
  time: string; // "HH:mm"
  location: UserLocation | null;
}

export interface UserPreferences {
  marketingConsent: boolean;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  birthData: UserBirthData;
  preferences: UserPreferences;
  points: number;
  tier: string;
  isAdmin: boolean;
}

interface ProfileContextType {
  /** 用户资料 */
  profile: Profile | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 是否已完成出生数据 */
  isBirthDataComplete: boolean;
  /** 是否是管理员 */
  isAdmin: boolean;
  /** 更新用户资料 */
  updateProfile: (updates: Partial<Omit<Profile, "id" | "isAdmin">>) => Promise<void>;
  /** 更新出生数据 */
  updateBirthData: (data: Partial<UserBirthData>) => Promise<void>;
  /** 刷新资料 */
  refreshProfile: () => Promise<void>;
}

const defaultBirthData: UserBirthData = {
  date: null,
  time: "",
  location: null,
};

// ============ Context ============

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// ============ Provider ============

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取用户资料
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[ProfileContext] Error fetching profile:", error);
        throw error;
      }

      // 如果 profile 不存在，创建一个新的
      if (!data) {
        const { data: session } = await supabase.auth.getSession();
        const email = session.session?.user?.email || "";

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: email,
            full_name: email.split("@")[0] || "User",
            points: 0,
            tier: "Star Walker",
          })
          .select()
          .single();

        if (insertError) {
          console.error("[ProfileContext] Error creating profile:", insertError);
          // 使用默认值
          setProfile({
            id: userId,
            name: email.split("@")[0] || "User",
            email: email,
            birthData: defaultBirthData,
            preferences: { marketingConsent: false },
            points: 0,
            tier: "Star Walker",
            isAdmin: false,
          });
          return;
        }

        setProfile(mapDbToProfile(newProfile));
        return;
      }

      setProfile(mapDbToProfile(data));
    } catch (err) {
      console.error("[ProfileContext] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 监听认证状态
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchProfile]);

  // 更新用户资料
  const updateProfile = useCallback(async (updates: Partial<Omit<Profile, "id" | "isAdmin">>) => {
    if (!user || !profile) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.points !== undefined) dbUpdates.points = updates.points;
    if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
    if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;

    const { error } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("id", user.id);

    if (error) {
      console.error("[ProfileContext] Update error:", error);
      throw error;
    }

    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }, [user, profile]);

  // 更新出生数据
  const updateBirthData = useCallback(async (data: Partial<UserBirthData>) => {
    if (!user || !profile) return;

    const updates: Record<string, unknown> = {};
    if (data.date) updates.birth_date = data.date.toISOString();
    if (data.time) updates.birth_time = data.time;
    if (data.location) {
      updates.birth_place = data.location.name;
      updates.lat = data.location.lat;
      updates.lng = data.location.lng;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      console.error("[ProfileContext] Update birth data error:", error);
      throw error;
    }

    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        birthData: { ...prev.birthData, ...data },
      };
    });
  }, [user, profile]);

  // 刷新资料
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // 计算派生状态
  const isBirthDataComplete = !!(
    profile?.birthData.date &&
    profile?.birthData.time &&
    profile?.birthData.location
  );

  const isAdmin = profile?.isAdmin ?? false;

  const value: ProfileContextType = {
    profile,
    loading,
    isBirthDataComplete,
    isAdmin,
    updateProfile,
    updateBirthData,
    refreshProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

// ============ Hook ============

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

// ============ Utilities ============

/**
 * 将数据库记录映射为 Profile 对象
 */
function mapDbToProfile(data: Record<string, unknown>): Profile {
  return {
    id: data.id as string,
    name: (data.full_name as string) || "",
    email: (data.email as string) || "",
    birthData: {
      date: data.birth_date ? new Date(data.birth_date as string) : null,
      time: (data.birth_time as string) || "",
      location: data.lat
        ? {
            name: (data.birth_place as string) || "",
            lat: data.lat as number,
            lng: data.lng as number,
          }
        : null,
    },
    preferences: (data.preferences as UserPreferences) || { marketingConsent: false },
    points: (data.points as number) || 0,
    tier: (data.tier as string) || "Star Walker",
    isAdmin: !!(data.is_admin),
  };
}

/**
 * 快捷访问 - 获取用户出生数据
 */
export function useBirthData(): UserBirthData | null {
  const { profile } = useProfile();
  return profile?.birthData ?? null;
}

/**
 * 快捷访问 - 检查是否是管理员
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useProfile();
  return isAdmin;
}
