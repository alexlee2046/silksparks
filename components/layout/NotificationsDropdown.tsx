import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../services/supabase";

interface NotificationsDropdownProps {
  userId: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  userId,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
          setNotifications((prev) => [payload.new as Notification, ...prev]);
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
      className="absolute top-12 right-0 w-80 bg-background border border-surface-border rounded-xl shadow-2xl p-4 z-50"
    >
      <h3 className="text-foreground font-bold text-sm mb-3">Notifications</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-text-muted">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-xs text-text-muted">No new notifications.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="p-2 bg-surface-border/30 rounded-lg">
              <p className="text-xs font-bold text-primary">{n.title}</p>
              <p className="text-xs text-text-muted">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
