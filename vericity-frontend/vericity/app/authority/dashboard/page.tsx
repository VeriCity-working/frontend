"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RoleShell } from "@/components/layout/RoleShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { fetchAuthorityQueue } from "@/lib/api";
import type { ComplaintPublic, ComplaintStatus } from "@/lib/types";

const NAV = [
  { href: "/authority/dashboard", label: "Queue" },
  { href: "/authority/officers", label: "Officers" },
  { href: "/authority/portfolio", label: "Portfolio" }
];

const FILTERS: { label: string; statuses: ComplaintStatus[] | null }[] = [
  { label: "All", statuses: null },
  { label: "Needs assignment", statuses: ["filed"] },
  { label: "In the field", statuses: ["assigned", "in_progress"] },
  { label: "Needs my review", statuses: ["under_review", "work_completed"] },
  { label: "Reopened", statuses: ["reopened"] }
];

export default function AuthorityDashboardPage() {
  const { session, ready, logout } = useRequireRole("authority");
  const [complaints, setComplaints] = useState<ComplaintPublic[] | null>(null);
  const [filter, setFilter] = useState(0);

  useEffect(() => {
    if (ready && session) fetchAuthorityQueue(session.id).then(setComplaints);
  }, [ready, session]);

  const filtered = useMemo(() => {
    if (!complaints) return null;
    const statuses = FILTERS[filter].statuses;
    return statuses ? complaints.filter((c) => statuses.includes(c.status)) : complaints;
  }, [complaints, filter]);

  if (!ready || !session) return null;

  return (
    <RoleShell role="authority" roleLabel="Authority dashboard" identityLabel={session.label} items={NAV} onLogout={logout}>
      <h1 className="font-display text-2xl text-ink">Complaint queue</h1>
      <p className="mt-1 text-sm text-ink-soft">Everything currently routed to {session.label}.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f, i) => (
          <button
            key={f.label}
            onClick={() => setFilter(i)}
            className={[
              "rounded px-3 py-1.5 text-sm font-medium",
              filter === i ? "bg-steel text-paper-raised" : "bg-steel-soft text-steel hover:bg-steel/20"
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {filtered === null && <p className="text-sm text-ink-soft">Loading…</p>}
        {filtered?.length === 0 && (
          <EmptyState title="Nothing here" detail="This filter has no matching complaints right now." />
        )}
        {filtered?.map((c) => (
          <Link key={c.id} href={`/authority/assignments/${c.id}`}>
            <Card className="flex items-center gap-4 p-4 transition-colors hover:border-steel/40">
              <img src={c.before_photo_url} alt="" className="h-16 w-16 flex-shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{c.description || "No description"}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  Filed {new Date(c.created_at).toLocaleDateString()} · {c.upvote_count} citizen upvote{c.upvote_count === 1 ? "" : "s"}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </Card>
          </Link>
        ))}
      </div>
    </RoleShell>
  );
}
