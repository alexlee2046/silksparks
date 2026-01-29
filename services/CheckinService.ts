import { supabase } from "./supabase";

export interface CheckinResult {
  success: boolean;
  streakDays: number;
  pointsEarned: number;
  bonusReward?: string;
  error?: string;
}

function calculatePoints(streakDays: number): number {
  if (streakDays >= 30) return 200;
  if (streakDays >= 14) return 100;
  if (streakDays >= 7) return 50;
  if (streakDays >= 3) return 15;
  if (streakDays >= 2) return 10;
  return 5;
}

function getBonusReward(streakDays: number): string | undefined {
  if (streakDays === 7) return "Free Tarot Three-Card Spread unlocked!";
  if (streakDays === 14) return "10% Expert Consultation discount earned!";
  if (streakDays === 30) return "Tier upgrade bonus!";
  return undefined;
}

export const CheckinService = {
  async hasCheckedInToday(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("checkin_history")
      .select("id")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .maybeSingle();
    if (error) {
      console.error("[CheckinService] Error checking today:", error);
      return false;
    }
    return !!data;
  },

  async getCurrentStreak(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("profiles")
      .select("streak_days")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("[CheckinService] Error getting streak:", error);
      return 0;
    }
    return data?.streak_days || 0;
  },

  async checkin(userId: string): Promise<CheckinResult> {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const alreadyCheckedIn = await this.hasCheckedInToday(userId);
    if (alreadyCheckedIn) {
      return {
        success: false,
        streakDays: await this.getCurrentStreak(userId),
        pointsEarned: 0,
        error: "Already checked in today",
      };
    }

    const { data: yesterdayCheckin } = await supabase
      .from("checkin_history")
      .select("streak_days")
      .eq("user_id", userId)
      .eq("checkin_date", yesterday)
      .maybeSingle();

    const newStreak = yesterdayCheckin ? yesterdayCheckin.streak_days + 1 : 1;
    const pointsEarned = calculatePoints(newStreak);
    const bonusReward = getBonusReward(newStreak);

    const { error: checkinError } = await supabase
      .from("checkin_history")
      .insert({
        user_id: userId,
        checkin_date: today,
        streak_days: newStreak,
        points_earned: pointsEarned,
      });

    if (checkinError) {
      console.error("[CheckinService] Error inserting checkin:", checkinError);
      return { success: false, streakDays: 0, pointsEarned: 0, error: "Failed to record check-in" };
    }

    const { data: profile } = await supabase.from("profiles").select("points").eq("id", userId).single();
    const currentPoints = profile?.points || 0;

    await supabase.from("profiles").update({
      last_checkin_date: today,
      streak_days: newStreak,
      points: currentPoints + pointsEarned,
    }).eq("id", userId);

    await supabase.from("point_transactions").insert({
      user_id: userId,
      amount: pointsEarned,
      type: "checkin",
      description: `Day ${newStreak} check-in reward`,
    });

    return { success: true, streakDays: newStreak, pointsEarned, bonusReward };
  },

  async getCheckinHistory(userId: string, days: number = 30): Promise<Date[]> {
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("checkin_history")
      .select("checkin_date")
      .eq("user_id", userId)
      .gte("checkin_date", startDate)
      .order("checkin_date", { ascending: false });
    if (error) {
      console.error("[CheckinService] Error getting history:", error);
      return [];
    }
    return data?.map((d) => new Date(d.checkin_date)) || [];
  },
};
