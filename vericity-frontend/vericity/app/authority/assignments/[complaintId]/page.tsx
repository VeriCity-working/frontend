"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoleShell } from "@/components/layout/RoleShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, ReviewBadge } from "@/components/ui/StatusBadge";
import { ComplaintTimeline } from "@/components/status/ComplaintTimeline";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import {
  createAssignment,
  fetchAssignmentSuggestions,
  fetchComplaintDetail,
  reviewResolution
} from "@/lib/api";
import type { CaseAssignment, ComplaintPublic, Officer, PriorityLevel, Resolution, Verification } from "@/lib/types";

const NAV = [
  { href: "/authority/dashboard", label: "Queue" },
  { href: "/authority/officers", label: "Officers" },
  { href: "/authority/portfolio", label: "Portfolio" }
];

const PRIORITIES: PriorityLevel[] = ["low", "normal", "high", "urgent"];

export default function AssignmentPage() {
  const { session, ready, logout } = useRequireRole("authority");
  const params = useParams<{ complaintId: string }>();
  const router = useRouter();

  const [data, setData] = useState<{
    complaint: ComplaintPublic;
    assignment?: CaseAssignment;
    resolution?: Resolution;
    verification?: Verification;
  } | null>(null);
  const [suggestions, setSuggestions] = useState<Officer[] | null>(null);
  const [priority, setPriority] = useState<PriorityLevel>("normal");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const d = await fetchComplaintDetail(params.complaintId);
    setData(d);
    if (!d.assignment) {
      setSuggestions(await fetchAssignmentSuggestions(params.complaintId));
    }
  };

  useEffect(() => {
    if (ready && session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session, params.complaintId]);

  if (!ready || !session) return null;

  const assign = async (officerId: string) => {
    setBusy(true);
    await createAssignment(params.complaintId, officerId, session.id, priority, null);
    await load();
    setBusy(false);
  };

  const review = async (decision: "approved" | "rejected" | "reassigned") => {
    setBusy(true);
    await reviewResolution(params.complaintId, decision, session.id);
    await load();
    setBusy(false);
  };

  const needsAssignment = data && !data.assignment;
  const needsReview =
    data?.resolution && data.resolution.review_status === "pending";

  return (
    <RoleShell role="authority" roleLabel="Authority dashboard" identityLabel={session.label} items={NAV} onLogout={logout}>
      <button onClick={() => router.push("/authority/dashboard")} className="text-sm text-ink-soft hover:text-ink">
        ← Back to queue
      </button>

      {!data ? (
        <p className="mt-4 text-sm text-ink-soft">Loading…</p>
      ) : (
        <div className="mt-3 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-ink-soft">Ref {data.complaint.derived_citizen_id}</p>
                <h1 className="mt-1 font-display text-2xl text-ink">{data.complaint.description || "Civic complaint"}</h1>
              </div>
              <StatusBadge status={data.complaint.status} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs font-medium text-ink-soft">Before</p>
                <img src={data.complaint.before_photo_url} alt="Before" className="aspect-square w-full rounded-lg object-cover" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-ink-soft">After</p>
                {data.resolution ? (
                  <img src={data.resolution.after_photo_url} alt="After" className="aspect-square w-full rounded-lg object-cover" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-paper-line text-xs text-ink-soft">
                    No evidence yet
                  </div>
                )}
              </div>
            </div>

            {needsAssignment && (
              <Card className="mt-5 p-5">
                <p className="font-display text-lg text-ink">Assign this case</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Ranked by performance and current workload — you make the final call.
                </p>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-ink-soft">Priority</span>
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`rounded px-2.5 py-1 text-xs font-medium capitalize ${
                        priority === p ? "bg-steel text-paper-raised" : "bg-steel-soft text-steel"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {suggestions?.map((o, i) => (
                    <div key={o.id} className="flex items-center justify-between rounded border border-paper-line p-3">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {o.name} <span className="text-xs font-normal text-ink-soft">· {o.officer_id}</span>
                          {i === 0 && (
                            <span className="ml-2 rounded bg-verified-soft px-1.5 py-0.5 text-[10px] font-medium text-verified">
                              Top match
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-ink-soft">
                          Score {o.performance_score} · {o.open_case_count ?? 0} open case{(o.open_case_count ?? 0) === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Button onClick={() => assign(o.id)} disabled={busy}>
                        Assign
                      </Button>
                    </div>
                  ))}
                  {suggestions?.length === 0 && <p className="text-sm text-ink-soft">No available officers in this domain yet.</p>}
                </div>
              </Card>
            )}

            {data.resolution && (
              <Card className="mt-5 p-5">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg text-ink">Completion evidence</p>
                  <ReviewBadge status={data.resolution.review_status} />
                </div>
                <p className="mt-2 text-sm text-ink">{data.resolution.officer_note || "No note left."}</p>
                <p className="mt-3 truncate text-xs text-ink-soft">
                  Record hash <span className="font-mono">{data.resolution.record_hash.slice(0, 32)}…</span>
                </p>

                {needsReview && (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => review("approved")} disabled={busy} className="flex-1">
                      Approve
                    </Button>
                    <Button variant="secondary" onClick={() => review("reassigned")} disabled={busy} className="flex-1">
                      Reassign
                    </Button>
                    <Button variant="danger" onClick={() => review("rejected")} disabled={busy} className="flex-1">
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-ink-soft">Accountability trail</p>
            <Card className="p-5">
              <ComplaintTimeline
                complaint={data.complaint}
                assignment={data.assignment}
                resolution={data.resolution}
                verification={data.verification}
              />
            </Card>
          </div>
        </div>
      )}
    </RoleShell>
  );
}
