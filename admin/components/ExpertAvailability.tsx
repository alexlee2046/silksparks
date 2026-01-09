import React, { useState, useEffect } from "react";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";
import { supabase } from "../../services/supabase";

// Note: The actual DB schema uses day_of_week (number) not date
// This is a working type that matches the actual database structure
type AvailabilitySlot = {
  id?: string;
  expert_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  created_at?: string;
};

type DBAvailabilityRow = {
  id: string;
  expert_id: string;
  day_of_week?: number;
  date?: string;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  created_at?: string;
};

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type Props = {
  expertId: string;
};

export const ExpertAvailability: React.FC<Props> = ({ expertId }) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, [expertId]);

  const fetchAvailability = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("expert_availability")
        .select("*")
        .eq("expert_id", expertId)
        .order("day_of_week");

      if (fetchError) throw fetchError;
      // Map DB rows to our working type
      const mappedSlots: AvailabilitySlot[] = (data as DBAvailabilityRow[] || []).map(row => ({
        id: row.id,
        expert_id: row.expert_id,
        day_of_week: row.day_of_week ?? 0,
        start_time: row.start_time,
        end_time: row.end_time,
        is_available: row.is_available,
        created_at: row.created_at,
      }));
      setSlots(mappedSlots);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load availability");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlot = () => {
    const newSlot: AvailabilitySlot = {
      expert_id: expertId,
      day_of_week: 1,
      start_time: "09:00",
      end_time: "17:00",
    };
    setSlots([...slots, newSlot]);
  };

  const handleRemoveSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    setSlots(newSlots);
  };

  const handleSlotChange = (index: number, field: "day_of_week" | "start_time" | "end_time", value: string | number) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value } as AvailabilitySlot;
    setSlots(newSlots);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Delete all existing slots
      await supabase
        .from("expert_availability")
        .delete()
        .eq("expert_id", expertId);

      // Insert new slots
      if (slots.length > 0) {
        const slotsToInsert = slots.map(({ id, created_at, ...slot }) => ({
          expert_id: slot.expert_id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available ?? true,
        }));
        const { error: insertError } = await supabase
          .from("expert_availability")
          .insert(slotsToInsert as any);

        if (insertError) throw insertError;
      }

      // Refresh data
      await fetchAvailability();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save availability");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6" intensity="low">
        <div className="text-text-muted text-center animate-pulse">
          Loading availability...
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 border-surface-border" intensity="low">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display text-foreground">Weekly Availability</h2>
        <GlowButton variant="secondary" icon="add" onClick={handleAddSlot}>
          Add Time Slot
        </GlowButton>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {slots.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">
            event_busy
          </span>
          <p>No availability set</p>
          <p className="text-xs mt-1">Add time slots when this expert is available for consultations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {slots.map((slot, index) => (
            <div
              key={slot.id || index}
              className="flex items-center gap-4 p-4 rounded-lg bg-surface-border/20 border border-surface-border"
            >
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Day
                  </label>
                  <select
                    value={slot.day_of_week}
                    onChange={(e) => handleSlotChange(index, "day_of_week", parseInt(e.target.value))}
                    className="w-full bg-background border border-surface-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  >
                    {DAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => handleSlotChange(index, "start_time", e.target.value)}
                    className="w-full bg-background border border-surface-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => handleSlotChange(index, "end_time", e.target.value)}
                    className="w-full bg-background border border-surface-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <button
                onClick={() => handleRemoveSlot(index)}
                className="text-text-muted hover:text-red-400 transition-colors p-2"
                title="Remove slot"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-surface-border flex justify-end">
        <GlowButton variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Availability"}
        </GlowButton>
      </div>

      <p className="mt-4 text-xs text-text-muted">
        Set the regular weekly schedule. Users can book appointments during these time slots.
      </p>
    </GlassCard>
  );
};
