"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleShell } from "@/components/layout/RoleShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { fetchMyComplaints } from "@/lib/api";
import type { ComplaintPublic } from "@/lib/types";

const NAV = [
  { href: "/citizen/file", label: "File a complaint" },
  { href: "/citizen/complaints", label: "My complaints" }
];

export default function MyComplaintsPage() {
  const { session, ready, logout } = useRequireRole("citizen");
  const [complaints, setComplaints] = useState<ComplaintPublic[] | null>(null);

  useEffect(() => {
    if (ready && session) fetchMyComplaints().then(setComplaints);
  }, [ready, session]);

  if (!ready || !session) return null;

  return (
    <RoleShell role="citizen" roleLabel="Citizen" identityLabel={session.label} items={NAV} onLogout={logout}>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">My complaints</h1>
        <Link href="/citizen/file">
          <Button>File a new complaint</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {complaints === null && <p className="text-sm text-ink-soft">Loading…</p>}

        {complaints && complaints.length === 0 && (
          <EmptyState
            title="Nothing filed yet"
            detail="Anything you report will show up here, with its status tracked end to end."
            action={
              <Link href="/citizen/file">
                <Button variant="secondary">File your first complaint</Button>
              </Link>
            }
          />
        )}

        {complaints?.map((c) => (
          <Link key={c.id} href={`/citizen/complaints/${c.id}`}>
            <Card className="flex items-center gap-4 p-4 transition-colors hover:border-ink/30">
              <img src={c.before_photo_url} alt="" className="h-16 w-16 flex-shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{c.description || "No description"}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  Filed {new Date(c.created_at).toLocaleDateString()} · Ref {c.derived_citizen_id}
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
