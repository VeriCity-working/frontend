"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleShell } from "@/components/layout/RoleShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { fetchOfficerCases } from "@/lib/api";
import type { CaseAssignment, ComplaintPublic } from "@/lib/types";

const NAV = [{ href: "/officer/cases", label: "My cases" }];

const PRIORITY_TONE: Record<string, string> = {
  urgent: "text-brick",
  high: "text-signal",
  normal: "text-ink-soft",
  low: "text-ink-soft"
};

export default function OfficerCasesPage() {
  const { session, ready, logout } = useRequireRole("officer");
  const [cases, setCases] = useState<{ complaint: ComplaintPublic; assignment: CaseAssignment }[] | null>(null);

  useEffect(() => {
    if (ready && session) fetchOfficerCases(session.id).then(setCases);
  }, [ready, session]);

  if (!ready || !session) return null;

  return (
    <RoleShell role="officer" roleLabel="Officer portal" identityLabel={session.label} items={NAV} onLogout={logout}>
      <h1 className="font-display text-2xl text-ink">My cases</h1>
      <p className="mt-1 text-sm text-ink-soft">Assigned to you — accept, do the work, submit proof.</p>

      <div className="mt-6 flex flex-col gap-3">
        {cases === null && <p className="text-sm text-ink-soft">Loading…</p>}
        {cases?.length === 0 && <EmptyState title="No cases assigned yet" detail="New assignments will show up here." />}
        {cases?.map(({ complaint, assignment }) => (
          <Link key={complaint.id} href={`/officer/cases/${complaint.id}`}>
            <Card className="flex items-center gap-4 p-4 transition-colors hover:border-officer/40">
              <img src={complaint.before_photo_url} alt="" className="h-16 w-16 flex-shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{complaint.description || "No description"}</p>
                <p className={`mt-1 text-xs font-medium capitalize ${PRIORITY_TONE[assignment.priority]}`}>
                  {assignment.priority} priority
                </p>
              </div>
              <StatusBadge status={complaint.status} />
            </Card>
          </Link>
        ))}
      </div>
    </RoleShell>
  );
}
