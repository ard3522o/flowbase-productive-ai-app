"use client";

import { useState } from "react";
import { useMyPresence, useOthers } from "@liveblocks/react/suspense";
import { useLiveblocksEnabled } from "@/components/liveblocks-provider";
import {
  UserPlus,
  Users,
  X,
  Mail,
  Check,
  Crown,
  Circle,
} from "lucide-react";

/* ── Avatar colors ── */
const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-fuchsia-500",
  "bg-indigo-500",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ── Active Users Bar ── */
export function ActiveUsersBar() {
  const enabled = useLiveblocksEnabled();
  if (!enabled) return <div className="flex items-center gap-2"><span className="text-[11px] text-slate-400">Add Liveblocks key to collaborate</span></div>;
  const others = useOthers();
  const [myPresence] = useMyPresence();

  const totalOnline = others.length + 1;

  return (
    <div className="flex items-center gap-2">
      {/* Self avatar */}
      <div
        className="relative"
        title={`${myPresence.name || "You"} (you)`}
      >
        <span
          className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-white ${myPresence.color || "bg-violet-500"}`}
        >
          {getInitials(myPresence.name || "You")}
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" />
      </div>

      {/* Other users */}
      {others.map(({ connectionId, presence }) => {
        const colorIdx = connectionId % AVATAR_COLORS.length;
        return (
          <div
            key={connectionId}
            className="relative -ml-1.5"
            title={presence.name || `User ${connectionId}`}
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-white ${presence.color || AVATAR_COLORS[colorIdx]}`}
            >
              {getInitials(presence.name || "?")}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
        );
      })}

      {totalOnline > 1 && (
        <span className="ml-1 text-[11px] font-medium text-slate-400">
          {totalOnline} online
        </span>
      )}
    </div>
  );
}

/* ── Share Dialog ── */
type SharedUser = { email: string; name: string; role: "owner" | "editor" | "viewer" };

export function ShareDialog({
  open,
  onClose,
  boardName,
}: {
  open: boolean;
  onClose: () => void;
  boardName: string;
}) {
  const [users, setUsers] = useState<SharedUser[]>([
    { email: "abhay@example.com", name: "Abhay", role: "owner" },
  ]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [justInvited, setJustInvited] = useState<string | null>(null);

  if (!open) return null;

  const inviteUser = () => {
    if (!inviteEmail.trim() || users.some((u) => u.email === inviteEmail.trim())) return;
    const newUser: SharedUser = {
      email: inviteEmail.trim(),
      name: inviteEmail.split("@")[0],
      role: inviteRole,
    };
    setUsers((prev) => [...prev, newUser]);
    setJustInvited(newUser.email);
    setInviteEmail("");
    setTimeout(() => setJustInvited(null), 2000);
  };

  const removeUser = (email: string) => {
    setUsers((prev) => prev.filter((u) => u.email !== email));
  };

  const roleBadge = (role: string) => {
    if (role === "owner") return "bg-violet-100 text-violet-700 border-violet-200";
    if (role === "editor") return "bg-sky-100 text-sky-700 border-sky-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share board"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/25 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">
              Collaboration
            </p>
            <h2 className="mt-1 text-lg font-bold">Share board</h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Manage who can access &quot;{boardName}&quot;
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Invite input */}
        <div className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
            <input
              autoFocus
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") inviteUser();
              }}
              placeholder="Invite by email..."
              type="email"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-[13px] outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-[12px] font-medium text-slate-600 outline-none focus:border-violet-300"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="button"
            onClick={inviteUser}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2.5 text-[12px] font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
          </button>
        </div>

        {justInvited && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600">
            <Check className="h-3 w-3" /> {justInvited} has been invited!
          </p>
        )}

        {/* User list */}
        <div className="mt-5 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Shared with ({users.length})
          </p>
          {users.map((user) => {
            const colorIdx =
              user.email.charCodeAt(0) % AVATAR_COLORS.length;
            return (
              <div
                key={user.email}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${AVATAR_COLORS[colorIdx]}`}
                >
                  {getInitials(user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-slate-700">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {user.email}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${roleBadge(user.role)}`}
                >
                  {user.role === "owner" && (
                    <Crown className="h-2.5 w-2.5" />
                  )}
                  {user.role}
                </span>
                {user.role !== "owner" && (
                  <button
                    type="button"
                    onClick={() => removeUser(user.email)}
                    className="grid h-6 w-6 shr
ink-0 place-items-center rounded-md text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                    title="Remove user"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 -z-10"
        aria-label="Close backdrop"
      />
    </div>
  );
}

/* ── Collaboration Settings Button ── */
export function CollaborationButton({
  onClick,
  onlineCount,
}: {
  onClick: () => void;
  onlineCount: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-sm transition-colors hover:border-violet-200 hover:text-violet-700"
      title="Board collaboration settings"
    >
      <Users className="h-3.5 w-3.5 text-violet-500" />
      <span>Collaborate</span>
      {onlineCount > 0 && (
        <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-100 px-1 text-[10px] font-bold text-emerald-600">
          {onlineCount}
        </span>
      )}
    </button>
  );
}
