import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCheckin } from "../hooks/useCheckin";
import toast from "react-hot-toast";

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({ isOpen, onClose }) => {
  const { hasCheckedInToday, currentStreak, checkin, isLoading } = useCheckin();
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateNextPoints = (streak: number): number => {
    const nextStreak = streak + 1;
    if (nextStreak >= 30) return 200;
    if (nextStreak >= 14) return 100;
    if (nextStreak >= 7) return 50;
    if (nextStreak >= 3) return 15;
    if (nextStreak >= 2) return 10;
    return 5;
  };

  const getNextRewardInfo = (streak: number): { days: number; reward: string } | null => {
    const nextStreak = streak + 1;
    if (nextStreak < 7) {
      return { days: 7 - nextStreak, reward: "Free Tarot Three-Card Spread" };
    } else if (nextStreak < 14) {
      return { days: 14 - nextStreak, reward: "10% Expert Consultation Discount" };
    } else if (nextStreak < 30) {
      return { days: 30 - nextStreak, reward: "Tier Upgrade Bonus" };
    }
    return null;
  };

  const getBonusReward = (streak: number): string | null => {
    if (streak === 7) return "Free Tarot Three-Card Spread unlocked!";
    if (streak === 14) return "10% Expert Consultation discount earned!";
    if (streak === 30) return "Tier upgrade bonus!";
    return null;
  };

  const handleCheckin = async () => {
    setIsProcessing(true);
    try {
      const result = await checkin();

      if (result?.success) {
        if (result.bonusReward) {
          toast.success(
            <div>
              <div className="font-bold">Bonus Reward!</div>
              <div>{result.bonusReward}</div>
              <div className="text-sm mt-1">+{result.pointsEarned} points earned</div>
            </div>,
            { duration: 5000 }
          );
        } else {
          toast.success(`+${result.pointsEarned} points earned!`, { duration: 3000 });
        }
      } else if (result?.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to check in. Please try again.");
      console.error("[CheckinModal] Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const nextPoints = calculateNextPoints(currentStreak);
  const nextRewardInfo = getNextRewardInfo(currentStreak);
  const currentBonusReward = getBonusReward(currentStreak + 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header with gradient background */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/10 border-b border-surface-border p-6 text-center">
              <div className="flex justify-center mb-3">
                <span className="material-symbols-outlined text-5xl text-primary">
                  local_fire_department
                </span>
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                Daily Check-in
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Streak Display */}
              <div className="text-center">
                <div className="text-sm text-text-muted mb-2">Current Streak</div>
                <div className="text-5xl font-bold text-primary mb-1">
                  {currentStreak}
                </div>
                <div className="text-sm text-text-muted">
                  {currentStreak === 1 ? "day" : "days"}
                </div>
              </div>

              {/* Points Preview or Already Checked In */}
              {!hasCheckedInToday ? (
                <>
                  {/* Points Preview */}
                  <div className="bg-background-alt border border-surface-border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Points Today</span>
                      <span className="text-xl font-bold text-success">+{nextPoints}</span>
                    </div>
                  </div>

                  {/* Bonus Reward Display */}
                  {currentBonusReward && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/50 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-2xl text-primary">
                          stars
                        </span>
                        <div>
                          <div className="font-bold text-foreground mb-1">Bonus Reward!</div>
                          <div className="text-sm text-text-muted">{currentBonusReward}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Next Reward Preview */}
                  {nextRewardInfo && (
                    <div className="bg-background-alt border border-surface-border rounded-xl p-4">
                      <div className="text-sm text-text-muted mb-2">Next Reward</div>
                      <div className="text-foreground font-medium mb-1">
                        {nextRewardInfo.reward}
                      </div>
                      <div className="text-sm text-primary">
                        In {nextRewardInfo.days} {nextRewardInfo.days === 1 ? "day" : "days"}
                      </div>
                    </div>
                  )}

                  {/* Check-in Button */}
                  <button
                    onClick={handleCheckin}
                    disabled={isProcessing || isLoading}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Checking in..." : "Check in Now"}
                  </button>
                </>
              ) : (
                /* Already Checked In State */
                <div className="text-center py-4">
                  <span className="material-symbols-outlined text-6xl text-success mb-3">
                    check_circle
                  </span>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    See you tomorrow!
                  </h3>
                  <p className="text-text-muted">
                    You've already checked in today. Come back tomorrow to continue your streak!
                  </p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full bg-surface-border hover:bg-surface-border/80 text-foreground font-medium py-2 px-6 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
