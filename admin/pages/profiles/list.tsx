import React from "react";
import { useList, useUpdate } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { AuditService } from "../../../services/AuditService";

export const ProfileList: React.FC = () => {
  const { query } = useList({
    resource: "profiles",
  });
  const { mutate } = useUpdate();

  const { data: profiles, isLoading } = query;

  const handleRoleUpdate = async (
    id: string,
    currentStatus: boolean,
    name: string,
    email?: string,
  ) => {
    const action = currentStatus
      ? "remove admin rights from"
      : "grant admin rights to";
    if (
      window.confirm(
        `Are you sure you want to ${action} ${name || "this user"}?`,
      )
    ) {
      // SECURITY: Log admin role change before mutation
      await AuditService.log({
        action: "update_user_role",
        targetType: "profile",
        targetId: id,
        oldValue: { is_admin: currentStatus },
        newValue: { is_admin: !currentStatus },
        metadata: {
          user_name: name || "Unknown",
          user_email: email || "Unknown",
        },
      });

      mutate({
        resource: "profiles",
        id,
        values: {
          is_admin: !currentStatus,
        },
        successNotification: () => {
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
        <div className="text-text-muted font-display animate-pulse">
          Scanning Star Souls...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
        Star Souls (Users)
      </h1>

      <GlassCard className="p-0 border-surface-border overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-surface-border/30 border-b border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
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
                className="hover:bg-surface-border/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        className="w-8 h-8 rounded-full border border-surface-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {profile.email?.charAt(0) || "?"}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {profile.full_name || "Unnamed Soul"}
                      </div>
                      <div className="text-xs text-text-muted">
                        {profile.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() =>
                      handleRoleUpdate(
                        profile.id,
                        profile.is_admin,
                        profile.full_name,
                        profile.email,
                      )
                    }
                    className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      profile.is_admin
                        ? "bg-primary/20 border-primary/50 text-primary hover:bg-primary/30"
                        : "bg-surface-border/30 border-surface-border text-text-muted hover:bg-surface-border/30 hover:text-foreground/60 hover:border-surface-border"
                    }`}
                    title={
                      profile.is_admin
                        ? "Click to demote"
                        : "Click to promote to Admin"
                    }
                  >
                    {profile.is_admin ? "Admin" : "User"}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">
                  {profile.tier}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-primary">
                  {profile.points}
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">
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
