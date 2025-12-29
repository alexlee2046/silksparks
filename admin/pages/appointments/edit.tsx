import React from "react";
import { useForm, useSelect } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const AppointmentEdit: React.FC = () => {
  const { onFinish, mutation, query: queryResult, formLoading } = useForm({
    action: "edit",
    resource: "appointments",
    redirect: "list",
  });

  const appointment = queryResult?.data?.data;

  const { options: userOptions } = useSelect({
    resource: "profiles",
    optionLabel: "email",
    optionValue: "id",
    defaultValue: appointment?.user_id,
  });

  const { options: expertOptions } = useSelect({
    resource: "experts",
    optionLabel: "name",
    optionValue: "id",
    defaultValue: appointment?.expert_id,
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onFinish(data);
  };

  if (formLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Loading Appointment...
        </div>
      </div>
    );
  }

  // Format datetime-local value
  const defaultDate = appointment?.booked_at
    ? new Date(appointment.booked_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-light text-white tracking-tight">
        Edit Session
      </h1>

      <GlassCard className="p-8 border-white/5" intensity="low">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Client (User)
              </label>
              <select
                name="user_id"
                defaultValue={appointment?.user_id}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors appearance-none"
              >
                <option value="">Select Client...</option>
                {userOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Expert
              </label>
              <select
                name="expert_id"
                defaultValue={appointment?.expert_id}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors appearance-none"
              >
                <option value="">Select Expert...</option>
                {expertOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Date & Time
              </label>
              <input
                type="datetime-local"
                name="booked_at"
                defaultValue={defaultDate}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Status
              </label>
              <select
                name="status"
                defaultValue={appointment?.status}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors appearance-none"
              >
                <option value="scheduled">Scheduled</option>
                <option value="re-scheduled">Re-Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="noshow">No Show</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Meeting Link (Zoom/Meet)
            </label>
            <input
              name="meeting_link"
              defaultValue={appointment?.meeting_link}
              placeholder="https://..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Internal Notes
            </label>
            <textarea
              name="notes"
              defaultValue={appointment?.notes}
              rows={4}
              placeholder="Private notes about the session..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <GlowButton
              variant="secondary"
              type="button"
              onClick={() => window.history.back()}
            >
              Cancel
            </GlowButton>
            <GlowButton
              variant="primary"
              type="submit"
              disabled={mutation?.isPending}
            >
              {mutation?.isPending ? "Saving..." : "Save Changes"}
            </GlowButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
