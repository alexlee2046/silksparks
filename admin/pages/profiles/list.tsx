import React from "react";
import { useList } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";

export const ProfileList: React.FC = () => {
  const { query } = useList({
    resource: "profiles",
  });
  const { data: profiles, isLoading } = query;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Scanning Star Souls...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-light text-white tracking-tight">
        Star Souls (Users)
      </h1>

      <GlassCard className="p-0 border-white/5 overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Tier</th>
              <th className="px-6 py-4">Points</th>
              <th className="px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {profiles?.data.map((profile: any) => (
              <tr
                key={profile.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        className="w-8 h-8 rounded-full border border-white/10"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {profile.email?.charAt(0) || "?"}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">
                        {profile.full_name || "Unnamed Soul"}
                      </div>
                      <div className="text-xs text-white/40">
                        {profile.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {profile.is_admin ? (
                    <span className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      User
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-white/60">
                  {profile.tier}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-primary">
                  {profile.points}
                </td>
                <td className="px-6 py-4 text-sm text-white/40">
                  {new Date(profile.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};
