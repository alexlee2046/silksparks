import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabase";

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

export interface Order {
  id: string;
  id_db?: string; // Supabase ID
  date: Date;
  items: {
    name: string;
    price: number;
    type: "product" | "service";
    status: string;
    image?: string;
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
  content: string | any;
  image?: string;
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
}

interface UserContextType {
  user: UserProfile;
  session: any;
  loading: boolean;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  updateBirthData: (data: Partial<UserBirthData>) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  addArchive: (item: ArchiveItem) => Promise<void>;
  signOut: () => Promise<void>;
  isBirthDataComplete: boolean;
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
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. 监听 Auth 状态变化
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(defaultUser);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. 从数据库获取用户资料
  const fetchUserProfile = async (userId: string) => {
    try {
      // 获取 profiles - 使用 maybeSingle 避免 406 错误
      let { data: profile, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

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
          return;
        }
        profile = newProfile;
      }

      if (pError) throw pError;

      // 获取 archives
      const { data: archives } = await supabase
        .from("archives")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // 获取 orders
      const { data: orders } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", userId);

      setUser({
        id: userId,
        name: profile?.full_name || "",
        email: profile?.email || "",
        birthData: {
          date: profile?.birth_date ? new Date(profile.birth_date) : null,
          time: "", // 如果有的话可以扩充
          location: profile?.lat
            ? { name: profile.birth_place, lat: profile.lat, lng: profile.lng }
            : null,
        },
        preferences: { marketingConsent: false },
        archives:
          archives?.map((a) => ({
            id: a.id,
            type: a.type,
            date: new Date(a.created_at),
            title: a.title,
            summary: a.summary,
            content: a.content,
            image: a.image_url,
          })) || [],
        orders:
          orders?.map((o) => ({
            id: o.id,
            date: new Date(o.created_at),
            items:
              o.order_items?.map((oi: any) => ({
                name: oi.name,
                price: oi.price,
                type: oi.type,
                status: o.status,
              })) || [],
            total: o.total,
            status: o.status as any,
          })) || [],
        points: profile?.points || 0,
        tier: profile?.tier || "Star Walker",
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!session) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: updates.name,
        points: updates.points,
        tier: updates.tier,
      })
      .eq("id", session.user.id);

    if (!error) setUser((prev) => ({ ...prev, ...updates }));
  };

  const updateBirthData = async (data: Partial<UserBirthData>) => {
    if (!session) return;
    const updates: any = {};
    if (data.date) updates.birth_date = data.date.toISOString();
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
  };

  const addOrder = async (order: Order) => {
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
    fetchUserProfile(session.user.id); // 刷新
  };

  const addArchive = async (item: ArchiveItem) => {
    if (!session) return;
    const { error } = await supabase.from("archives").insert({
      user_id: session.user.id,
      type: item.type,
      title: item.title,
      summary: item.summary,
      content: item.content,
      image_url: item.image,
    });

    if (!error) fetchUserProfile(session.user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(defaultUser);
  };

  const isBirthDataComplete = !!(
    user.name &&
    user.birthData.date &&
    user.birthData.location
  );

  return (
    <UserContext.Provider
      value={{
        user,
        session,
        loading,
        updateUser,
        updateBirthData,
        addOrder,
        addArchive,
        signOut,
        isBirthDataComplete,
      }}
    >
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
