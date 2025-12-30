import React from "react";
import { useList, useUpdate } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";

export const ProfileList: React.FC = () => {
  const { query } = useList({
    resource: "profiles",
  });
  const { mutate } = useUpdate();

  const { data: profiles, isLoading } = query;

  const handleRoleUpdate = (id: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? "remove admin rights from" : "grant admin rights to";
    if (window.confirm(`Are you sure you want to ${action} ${name || "this user"}?`)) {
      mutate({
        resource: "profiles",
        id,
        values: {
          is_admin: !currentStatus,
        },
        successNotification: (data: any) => {
          return {
            message: `Successfully updated role for ${name}`,
            type: "success",
          };
        },
      });
    }
  };

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
                  <button
                    onClick={() => handleRoleUpdate(profile.id, profile.is_admin, profile.full_name)}
                    className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${profile.is_admin
                      ? "bg-primary/20 border-primary/50 text-primary hover:bg-primary/30"
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60 hover:border-white/20"
                      }`}
                    title={profile.is_admin ? "Click to demote" : "Click to promote to Admin"}
                  >
                    {profile.is_admin ? "Admin" : "User"}
                  </button>
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
