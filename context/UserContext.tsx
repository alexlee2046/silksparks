/**
 * UserContext - 向后兼容的用户状态管理
 *
 * @deprecated 此 Context 已拆分为更小的单一职责 Context:
 * - AuthContext: 认证状态 (session, signOut)
 * - ProfileContext: 用户资料 (name, email, birthData, points, tier, isAdmin)
 *
 * 新代码请使用:
 * ```ts
 * import { useAuth } from "./context/AuthContext";
 * import { useProfile } from "./context/ProfileContext";
 *
 * const { session, signOut } = useAuth();
 * const { profile, updateBirthData } = useProfile();
 * ```
 *
 * 此文件保留以确保向后兼容，将在未来版本移除。
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { invalidateOrdersCache } from "../hooks/useOrders";
import { invalidateArchivesCache } from "../hooks/useArchives";

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

export interface OrderItemMetadata {
  date?: string | Date;
  time?: string;
  expertId?: string;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  id_db?: string; // Supabase ID
  date: Date;
  items: {
    name: string;
    price: number;
    type: "product" | "service" | "consultation";
    status: string;
    image?: string;
    metadata?: OrderItemMetadata;
  }[];
  total: number;
  status: "pending" | "completed" | "delivered";
}

export interface ArchiveItem {
  id: string;
  id_db?: string; // Supabase ID
  type: "Astrology" | "Tarot" | "Five Elements";
  date: Date;
  title: string;
  summary: string;
  content: string | Record<string, unknown>;
  image?: string;
}

export interface FavoriteItem {
  id: string; // Supabase ID
  product_id: number;
  created_at: Date;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  birthData: UserBirthData;
  preferences: {
    marketingConsent: boolean;
  };
  orders: Order[];
  archives: ArchiveItem[];
  points: number;
  tier: string;
  isAdmin: boolean; // Added field
  favorites: FavoriteItem[];
}

interface UserContextType {
  user: UserProfile;
  session: Session | null;
  loading: boolean;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  updateBirthData: (data: Partial<UserBirthData>) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  addArchive: (item: ArchiveItem) => Promise<void>;
  toggleFavorite: (productId: number) => Promise<void>;
  signOut: () => Promise<void>;
  isBirthDataComplete: boolean;
  isAdmin: boolean; // Direct access helper
  setLocalUser?: React.Dispatch<React.SetStateAction<UserProfile>>; // For local state updates without auth
}

const defaultUser: UserProfile = {
  name: "",
  email: "",
  birthData: {
    date: null,
    time: "",
    location: null,
  },
  preferences: {
    marketingConsent: false,
  },
  orders: [],
  archives: [],
  points: 0,
  tier: "Star Walker",
  isAdmin: false, // Default
  favorites: [],
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 监听 Auth 状态变化
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setLoading(false); // Ensure loading stops even if no session
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(defaultUser);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. 从数据库获取用户资料 (只加载核心 profile，其他数据延迟加载)
  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      // 获取 profiles - 使用 maybeSingle 避免 406 错误
      const { data: initialProfile, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      let profile = initialProfile;

      // 如果 profile 不存在，创建一个新的
      if (!profile && !pError) {
        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData.session?.user?.email || "";

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
          console.error("Error creating profile:", insertError);
          // 使用默认值
          setUser({
            ...defaultUser,
            id: userId,
            email: email,
            name: email.split("@")[0] || "User",
          });
          setLoading(false);
          return;
        }
        profile = newProfile;
      }

      if (pError) throw pError;

      // 只加载 profile 数据，archives/orders/favorites 由专用 hooks 延迟加载
      // Parse preferences from Json type
      const prefs = profile?.preferences as { marketingConsent?: boolean } | null;

      setUser({
        id: userId,
        name: profile?.full_name || "",
        email: profile?.email || "",
        birthData: {
          date: profile?.birth_date ? new Date(profile.birth_date) : null,
          time: profile?.birth_time || "",
          location: profile?.lat && profile?.lng != null
            ? { name: profile.birth_place || "", lat: profile.lat, lng: profile.lng }
            : null,
        },
        preferences: { marketingConsent: prefs?.marketingConsent ?? false },
        // 这些字段现在由 useArchives/useOrders/useFavorites hooks 管理
        archives: [],
        orders: [],
        favorites: [],
        points: profile?.points || 0,
        tier: profile?.tier || "Star Walker",
        isAdmin: !!profile?.is_admin,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = useCallback(async (updates: Partial<UserProfile>) => {
    if (!session) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.points !== undefined) dbUpdates.points = updates.points;
    if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
    if (updates.preferences !== undefined)
      dbUpdates.preferences = updates.preferences;

    const { error } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("id", session.user.id);

    if (!error) setUser((prev) => ({ ...prev, ...updates }));
  }, [session]);

  const updateBirthData = useCallback(async (data: Partial<UserBirthData>) => {
    if (!session) return;
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
      .eq("id", session.user.id);

    if (!error) {
      setUser((prev) => ({
        ...prev,
        birthData: { ...prev.birthData, ...data },
      }));
    }
  }, [session]);

  const addOrder = useCallback(async (order: Order) => {
    if (!session) return;
    // 先创建订单
    const { data: oData, error: oError } = await supabase
      .from("orders")
      .insert({
        user_id: session.user.id,
        total: order.total,
        status: order.status,
      })
      .select()
      .single();

    if (oError) return;

    // 插入订单项
    const items = order.items.map((i) => ({
      order_id: oData.id,
      name: i.name,
      price: i.price,
      type: i.type,
      image_url: i.image,
    }));

    await supabase.from("order_items").insert(items);

    // Check for consultations to create appointments
    for (const item of order.items) {
      if (item.type === "consultation" && item.metadata) {
        const { date, time, expertId } = item.metadata;
        if (date && time && expertId) {
          // Parse date and time to create timestamp
          // date is likely an ISO string or Date object
          // time is "HH:00 AM/PM"
          try {
            const baseDate = new Date(date);
            const [timePart, modifier] = time.split(" ");
            const [hoursStr, minutesStr] = (timePart ?? "12:00").split(":");
            let hours = Number(hoursStr ?? 12);
            const minutes = Number(minutesStr ?? 0);

            if (modifier === "PM" && hours < 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;

            baseDate.setHours(hours, minutes, 0, 0);

            // Insert appointment
            await supabase.from("appointments").insert({
              user_id: session.user.id,
              expert_id: expertId,
              booked_at: baseDate.toISOString(),
              duration_minutes: 60, // Default or from metadata
              status: "confirmed", // Auto-confirm for Paid orders? Or pending
              notes: `Booked via Order #${oData.id}`,
            });
          } catch (e) {
            console.error("Error creating appointment:", e);
          }
        }
      }
    }
    // 失效订单缓存，下次使用 useOrders() 时会重新加载
    invalidateOrdersCache();
  }, [session]);

  const addArchive = useCallback(async (item: ArchiveItem) => {
    if (!session) return;
    // Cast content to Json for Supabase compatibility
    const contentAsJson = (typeof item.content === "string"
      ? item.content
      : item.content) as import("../types/database").Json;
    const { error } = await supabase.from("archives").insert({
      user_id: session.user.id,
      type: item.type,
      title: item.title,
      summary: item.summary,
      content: contentAsJson,
      image_url: item.image,
    });

    if (!error) {
      // 失效归档缓存，下次使用 useArchives() 时会重新加载
      invalidateArchivesCache();
    }
  }, [session]);

  /**
   * @deprecated 使用 useFavorites() hook 替代
   * 保留此方法仅为向后兼容，内部不执行任何操作
   */
  const toggleFavorite = useCallback(async (_productId: number) => {
    console.warn(
      "[UserContext] toggleFavorite is deprecated. Use useFavorites() hook instead.",
    );
  }, []);

  const signOut = useCallback(async () => {
    // Note: Don't manually setUser(defaultUser) here - it's handled by
    // onAuthStateChange listener when session becomes null.
    // Calling it here would cause a race condition with the listener.
    await supabase.auth.signOut();
  }, []);

  // Location is optional - only name, date and time are required
  const isBirthDataComplete = !!(
    user.name &&
    user.birthData.date &&
    user.birthData.time
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      session,
      loading,
      updateUser,
      updateBirthData,
      addOrder,
      addArchive,
      toggleFavorite,
      signOut,
      isBirthDataComplete,
      isAdmin: user.isAdmin,
      setLocalUser: setUser,
    }),
    [
      user,
      session,
      loading,
      updateUser,
      updateBirthData,
      addOrder,
      addArchive,
      toggleFavorite,
      signOut,
      isBirthDataComplete,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
