# Growth & Retention Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement viral sharing and daily check-in systems to boost user retention and conversion.

**Architecture:**
- P0-1: Wire existing TarotShareCard component into TarotDaily page
- P0-2: Build daily check-in system with streak tracking and point rewards
- Database changes via Supabase migrations

**Tech Stack:** React 19, TypeScript, Supabase, Framer Motion, Tailwind CSS

---

## Phase 1: Share Flow Fix (P0)

### Task 1.1: Add Share Card State to TarotDaily

**Files:**
- Modify: `pages/features/TarotDaily.tsx`

**Step 1: Add showShareCard state**

Add to existing state declarations (around line 46):

```typescript
const [showShareCard, setShowShareCard] = useState(false);
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add pages/features/TarotDaily.tsx
git commit -m "feat(tarot): add share card state"
```

---

### Task 1.2: Wire Share Button to TarotShareCard

**Files:**
- Modify: `pages/features/TarotDaily.tsx`

**Step 1: Import TarotShareCard**

Add import at top of file:

```typescript
import { TarotShareCard } from "../../components/TarotShareCard";
```

**Step 2: Replace share button onClick**

Find the share button (around line 424):

```typescript
onClick={() =>
  toast.success("Shared to your cosmic timeline!")
}
```

Replace with:

```typescript
onClick={() => setShowShareCard(true)}
```

**Step 3: Add TarotShareCard render**

Add before the closing `</div>` of the main container (around line 577):

```typescript
{/* Share Card Modal */}
{showShareCard && card && (
  <TarotShareCard
    card={card}
    coreMessage={coreMessage}
    interpretation={interpretation}
    onClose={() => setShowShareCard(false)}
  />
)}
```

**Step 4: Verify lint passes**

Run: `npm run lint`
Expected: No new errors

**Step 5: Run relevant unit tests**

Run: `npm run test:unit -- --testPathPattern="TarotShareCard"`
Expected: All TarotShareCard tests pass

**Step 6: Commit**

```bash
git add pages/features/TarotDaily.tsx
git commit -m "feat(tarot): integrate TarotShareCard into daily reading"
```

---

### Task 1.3: Add Share Points Reward

**Files:**
- Modify: `components/TarotShareCard.tsx`

**Step 1: Import useUser hook**

Add import:

```typescript
import { useUser } from "../context/UserContext";
```

**Step 2: Get updateUser from context**

Add inside component:

```typescript
const { user, updateUser } = useUser();
```

**Step 3: Award points on successful share**

In `handleShare` function, after `toast.success("Shared successfully!")` (around line 84):

```typescript
// Award share points (15 points per share, max 2/day)
const today = new Date().toDateString();
const shareKey = `share_count_${today}`;
const shareCount = parseInt(localStorage.getItem(shareKey) || "0", 10);

if (shareCount < 2 && user.id) {
  await updateUser({ points: (user.points || 0) + 15 });
  localStorage.setItem(shareKey, String(shareCount + 1));
  toast.success("+15 Spark Points!", { icon: "✨" });
}
```

Also add after download success (around line 99):

```typescript
// Award share points for download too
const today = new Date().toDateString();
const shareKey = `share_count_${today}`;
const shareCount = parseInt(localStorage.getItem(shareKey) || "0", 10);

if (shareCount < 2 && user.id) {
  await updateUser({ points: (user.points || 0) + 15 });
  localStorage.setItem(shareKey, String(shareCount + 1));
  toast.success("+15 Spark Points!", { icon: "✨" });
}
```

**Step 4: Verify lint passes**

Run: `npm run lint`
Expected: No new errors

**Step 5: Commit**

```bash
git add components/TarotShareCard.tsx
git commit -m "feat(share): award 15 points per share (max 2/day)"
```

---

## Phase 2: Daily Check-in System (P0)

### Task 2.1: Create Database Migration

**Files:**
- Create: `supabase/migrations/20260129000000_add_checkin_system.sql`

**Step 1: Write migration file**

```sql
-- Add check-in fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_checkin_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;

-- Create checkin_history table
CREATE TABLE IF NOT EXISTS checkin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE NOT NULL,
  streak_days INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- Create point_transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE checkin_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checkin_history
CREATE POLICY "Users can view own checkins" ON checkin_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON checkin_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for point_transactions
CREATE POLICY "Users can view own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON point_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_checkin_user_date ON checkin_history(user_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_points_user ON point_transactions(user_id, created_at DESC);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260129000000_add_checkin_system.sql
git commit -m "feat(db): add checkin system migration"
```

---

### Task 2.2: Create Check-in Service

**Files:**
- Create: `services/CheckinService.ts`

**Step 1: Write the service**

```typescript
import { supabase } from "./supabase";

export interface CheckinResult {
  success: boolean;
  streakDays: number;
  pointsEarned: number;
  bonusReward?: string;
  error?: string;
}

/**
 * Calculate points based on streak days
 */
function calculatePoints(streakDays: number): number {
  if (streakDays >= 30) return 200;
  if (streakDays >= 14) return 100;
  if (streakDays >= 7) return 50;
  if (streakDays >= 3) return 15;
  if (streakDays >= 2) return 10;
  return 5;
}

/**
 * Get bonus reward description for milestone days
 */
function getBonusReward(streakDays: number): string | undefined {
  if (streakDays === 7) return "Free Tarot Three-Card Spread unlocked!";
  if (streakDays === 14) return "10% Expert Consultation discount earned!";
  if (streakDays === 30) return "Tier upgrade bonus!";
  return undefined;
}

export const CheckinService = {
  /**
   * Check if user has already checked in today
   */
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

  /**
   * Get user's current streak
   */
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

  /**
   * Perform daily check-in
   */
  async checkin(userId: string): Promise<CheckinResult> {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Check if already checked in today
    const alreadyCheckedIn = await this.hasCheckedInToday(userId);
    if (alreadyCheckedIn) {
      return {
        success: false,
        streakDays: await this.getCurrentStreak(userId),
        pointsEarned: 0,
        error: "Already checked in today",
      };
    }

    // Get yesterday's check-in to determine streak
    const { data: yesterdayCheckin } = await supabase
      .from("checkin_history")
      .select("streak_days")
      .eq("user_id", userId)
      .eq("checkin_date", yesterday)
      .maybeSingle();

    // Calculate new streak (continue if checked in yesterday, else reset to 1)
    const newStreak = yesterdayCheckin ? yesterdayCheckin.streak_days + 1 : 1;
    const pointsEarned = calculatePoints(newStreak);
    const bonusReward = getBonusReward(newStreak);

    // Insert check-in record
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
      return {
        success: false,
        streakDays: 0,
        pointsEarned: 0,
        error: "Failed to record check-in",
      };
    }

    // Update profile streak and points
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .single();

    const currentPoints = profile?.points || 0;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        last_checkin_date: today,
        streak_days: newStreak,
        points: currentPoints + pointsEarned,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[CheckinService] Error updating profile:", updateError);
    }

    // Record point transaction
    await supabase.from("point_transactions").insert({
      user_id: userId,
      amount: pointsEarned,
      type: "checkin",
      description: `Day ${newStreak} check-in reward`,
    });

    return {
      success: true,
      streakDays: newStreak,
      pointsEarned,
      bonusReward,
    };
  },

  /**
   * Get check-in history for calendar display
   */
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
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add services/CheckinService.ts
git commit -m "feat(checkin): add CheckinService with streak logic"
```

---

### Task 2.3: Create Check-in Hook

**Files:**
- Create: `hooks/useCheckin.ts`

**Step 1: Write the hook**

```typescript
import { useState, useEffect, useCallback } from "react";
import { CheckinService, CheckinResult } from "../services/CheckinService";
import { useUser } from "../context/UserContext";

interface UseCheckinReturn {
  isLoading: boolean;
  hasCheckedInToday: boolean;
  currentStreak: number;
  checkinHistory: Date[];
  checkin: () => Promise<CheckinResult | null>;
  refreshStatus: () => Promise<void>;
}

export function useCheckin(): UseCheckinReturn {
  const { user, session } = useUser();
  const userId = session?.user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [checkinHistory, setCheckinHistory] = useState<Date[]>([]);

  const refreshStatus = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [checked, streak, history] = await Promise.all([
        CheckinService.hasCheckedInToday(userId),
        CheckinService.getCurrentStreak(userId),
        CheckinService.getCheckinHistory(userId),
      ]);

      setHasCheckedInToday(checked);
      setCurrentStreak(streak);
      setCheckinHistory(history);
    } catch (error) {
      console.error("[useCheckin] Error refreshing status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const checkin = useCallback(async (): Promise<CheckinResult | null> => {
    if (!userId) return null;

    const result = await CheckinService.checkin(userId);

    if (result.success) {
      setHasCheckedInToday(true);
      setCurrentStreak(result.streakDays);
      // Refresh history to include new check-in
      const history = await CheckinService.getCheckinHistory(userId);
      setCheckinHistory(history);
    }

    return result;
  }, [userId]);

  return {
    isLoading,
    hasCheckedInToday,
    currentStreak,
    checkinHistory,
    checkin,
    refreshStatus,
  };
}
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add hooks/useCheckin.ts
git commit -m "feat(checkin): add useCheckin hook"
```

---

### Task 2.4: Create Check-in Modal Component

**Files:**
- Create: `components/CheckinModal.tsx`

**Step 1: Write the component**

```typescript
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCheckin } from "../hooks/useCheckin";
import toast from "react-hot-toast";

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({ isOpen, onClose }) => {
  const { isLoading, hasCheckedInToday, currentStreak, checkin } = useCheckin();
  const [isCheckinLoading, setIsCheckinLoading] = React.useState(false);
  const [checkinResult, setCheckinResult] = React.useState<{
    points: number;
    streak: number;
    bonus?: string;
  } | null>(null);

  const handleCheckin = async () => {
    setIsCheckinLoading(true);
    const result = await checkin();
    setIsCheckinLoading(false);

    if (result?.success) {
      setCheckinResult({
        points: result.pointsEarned,
        streak: result.streakDays,
        bonus: result.bonusReward,
      });
      toast.success(`+${result.pointsEarned} Spark Points!`, { icon: "✨" });

      if (result.bonusReward) {
        setTimeout(() => {
          toast.success(result.bonusReward!, { icon: "🎁", duration: 5000 });
        }, 1000);
      }
    } else if (result?.error) {
      toast.error(result.error);
    }
  };

  // Calculate reward preview
  const getNextReward = (streak: number): { days: number; reward: string } => {
    if (streak < 7) return { days: 7 - streak, reward: "Free Three-Card Spread" };
    if (streak < 14) return { days: 14 - streak, reward: "10% Expert Discount" };
    if (streak < 30) return { days: 30 - streak, reward: "Tier Upgrade Bonus" };
    return { days: 0, reward: "Maximum rewards reached!" };
  };

  const nextReward = getNextReward(currentStreak);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-amber-500/20 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"
              />

              <div className="relative z-10">
                <span className="material-symbols-outlined text-5xl text-primary mb-2 block">
                  local_fire_department
                </span>
                <h2 className="text-2xl font-bold text-foreground font-display">
                  Daily Check-in
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  {hasCheckedInToday ? "You've checked in today!" : "Claim your daily reward"}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Streak Display */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary font-display">
                    {checkinResult?.streak || currentStreak}
                  </div>
                  <div className="text-xs text-text-muted uppercase tracking-widest">
                    Day Streak
                  </div>
                </div>

                {!hasCheckedInToday && !checkinResult && (
                  <div className="h-12 w-px bg-surface-border" />
                )}

                {!hasCheckedInToday && !checkinResult && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      +{currentStreak >= 30 ? 200 : currentStreak >= 14 ? 100 : currentStreak >= 7 ? 50 : currentStreak >= 3 ? 15 : currentStreak >= 2 ? 10 : 5}
                    </div>
                    <div className="text-xs text-text-muted uppercase tracking-widest">
                      Points Today
                    </div>
                  </div>
                )}

                {checkinResult && (
                  <>
                    <div className="h-12 w-px bg-surface-border" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-center"
                    >
                      <div className="text-2xl font-bold text-green-400">
                        +{checkinResult.points}
                      </div>
                      <div className="text-xs text-text-muted uppercase tracking-widest">
                        Earned!
                      </div>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Next Reward Preview */}
              {nextReward.days > 0 && (
                <div className="bg-surface-border/30 rounded-xl p-4 border border-surface-border">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">
                      card_giftcard
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">
                        {nextReward.reward}
                      </p>
                      <p className="text-xs text-text-muted">
                        {nextReward.days} more day{nextReward.days > 1 ? "s" : ""} to unlock
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bonus Reward */}
              {checkinResult?.bonus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center"
                >
                  <span className="material-symbols-outlined text-primary text-2xl mb-2 block">
                    celebration
                  </span>
                  <p className="text-foreground font-medium">{checkinResult.bonus}</p>
                </motion.div>
              )}

              {/* Check-in Button */}
              {!hasCheckedInToday && !checkinResult ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckin}
                  disabled={isLoading || isCheckinLoading}
                  className="w-full py-4 rounded-xl bg-primary hover:bg-primary-hover text-background font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCheckinLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">
                        progress_activity
                      </span>
                      Checking in...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>
                      Check In Now
                    </>
                  )}
                </motion.button>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-xl border border-surface-border text-foreground hover:bg-surface-border/30 transition-colors font-medium"
                >
                  {checkinResult ? "Awesome!" : "See you tomorrow!"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CheckinModal;
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add components/CheckinModal.tsx
git commit -m "feat(checkin): add CheckinModal component"
```

---

### Task 2.5: Add Check-in to Dashboard

**Files:**
- Modify: `pages/dashboard/UserDashboard.tsx`

**Step 1: Import CheckinModal and hook**

Add imports:

```typescript
import { CheckinModal } from "../../components/CheckinModal";
import { useCheckin } from "../../hooks/useCheckin";
```

**Step 2: Add state and hook**

Inside component, add:

```typescript
const [showCheckin, setShowCheckin] = useState(false);
const { hasCheckedInToday, currentStreak } = useCheckin();

// Show check-in modal on first visit if not checked in
useEffect(() => {
  const hasSeenToday = localStorage.getItem(`checkin_prompt_${new Date().toDateString()}`);
  if (!hasCheckedInToday && !hasSeenToday) {
    setShowCheckin(true);
    localStorage.setItem(`checkin_prompt_${new Date().toDateString()}`, "true");
  }
}, [hasCheckedInToday]);
```

**Step 3: Add Check-in Card to Dashboard**

After the "Daily Insight" card (around line 247), add:

```typescript
{/* Daily Check-in Card */}
<DashboardCard
  title="Check-in"
  icon="local_fire_department"
  value={currentStreak}
  label={hasCheckedInToday ? "Day Streak" : "Check in!"}
  color="from-orange-500 to-red-500"
  onClick={() => setShowCheckin(true)}
/>
```

**Step 4: Add CheckinModal render**

Before the closing `</div>` of the component:

```typescript
{/* Check-in Modal */}
<CheckinModal
  isOpen={showCheckin}
  onClose={() => setShowCheckin(false)}
/>
```

**Step 5: Verify lint passes**

Run: `npm run lint`
Expected: No new errors

**Step 6: Commit**

```bash
git add pages/dashboard/UserDashboard.tsx
git commit -m "feat(dashboard): add daily check-in card and modal"
```

---

### Task 2.6: Add Check-in Prompt to Home Page

**Files:**
- Modify: `pages/Home.tsx`

**Step 1: Import CheckinModal and hook**

Add imports:

```typescript
import { CheckinModal } from "../components/CheckinModal";
import { useCheckin } from "../hooks/useCheckin";
```

**Step 2: Add state and hook**

Inside component, add:

```typescript
const [showCheckin, setShowCheckin] = useState(false);
const { hasCheckedInToday } = useCheckin();

// Show check-in reminder for logged-in users who haven't checked in
useEffect(() => {
  if (session && !hasCheckedInToday) {
    const hasSeenToday = localStorage.getItem(`home_checkin_${new Date().toDateString()}`);
    if (!hasSeenToday) {
      // Delay to not interrupt page load
      const timer = setTimeout(() => {
        setShowCheckin(true);
        localStorage.setItem(`home_checkin_${new Date().toDateString()}`, "true");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }
}, [session, hasCheckedInToday]);
```

Note: Need to get `session` from `useUser()` - it's already imported.

**Step 3: Add CheckinModal render**

Before the closing `</div>` of the component:

```typescript
{/* Check-in Modal */}
<CheckinModal
  isOpen={showCheckin}
  onClose={() => setShowCheckin(false)}
/>
```

**Step 4: Verify lint passes**

Run: `npm run lint`
Expected: No new errors

**Step 5: Commit**

```bash
git add pages/Home.tsx
git commit -m "feat(home): add check-in reminder for logged-in users"
```

---

## Phase 3: Testing & Verification

### Task 3.1: Manual Testing Checklist

**Share Flow:**
- [ ] Go to /tarot, complete a reading
- [ ] Click share button - should open TarotShareCard modal
- [ ] Click "Share Image" - should trigger native share or download
- [ ] Verify toast shows "+15 Spark Points"
- [ ] Share again - should still award points (up to 2x/day)
- [ ] Share a third time - should NOT award points

**Check-in Flow:**
- [ ] Log in to the app
- [ ] Visit Dashboard - check-in modal should auto-appear
- [ ] Click "Check In Now" - should show success animation
- [ ] Verify streak increases
- [ ] Verify points increase
- [ ] Close modal and reopen - should show "See you tomorrow"
- [ ] Refresh page - modal should NOT auto-appear again today

### Task 3.2: Final Commit

```bash
git add -A
git status
# If any uncommitted changes:
git commit -m "chore: cleanup and final adjustments"
```

---

## Summary

| Task | Status | Files |
|------|--------|-------|
| 1.1 Share state | ⬜ | TarotDaily.tsx |
| 1.2 Wire ShareCard | ⬜ | TarotDaily.tsx |
| 1.3 Share points | ⬜ | TarotShareCard.tsx |
| 2.1 DB migration | ⬜ | migrations/ |
| 2.2 CheckinService | ⬜ | services/ |
| 2.3 useCheckin hook | ⬜ | hooks/ |
| 2.4 CheckinModal | ⬜ | components/ |
| 2.5 Dashboard integration | ⬜ | UserDashboard.tsx |
| 2.6 Home integration | ⬜ | Home.tsx |
| 3.1 Manual testing | ⬜ | - |

**Estimated time:** 2-3 hours

---

*Generated with Claude Code using superpowers:writing-plans*
