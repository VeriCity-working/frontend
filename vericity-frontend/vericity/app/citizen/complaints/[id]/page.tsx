"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RoleShell } from "@/components/layout/RoleShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ComplaintTimeline } from "@/components/status/ComplaintTimeline";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { fetchComplaintDetail, submitVerification } from "@/lib/api";
import type { CaseAssignment, ComplaintPublic, Resolution, Verification } from "@/lib/types";

const NAV = [
  { href: "/citizen/file", label: "File a complaint" },
  { href: "/citizen/complaints", label: "My complaints" }
];

export default function CitizenComplaintDetailPage() {
  const { session, ready, logout } = useRequireRole("citizen");
  const params = useParams<{ id: string }>();

  const [data, setData] = useState<{
    complaint: ComplaintPublic;
    assignment?: CaseAssignment;
    resolution?: Resolution;
    verification?: Verification;
  } | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState<"confirmed" | "disputed" | null>(null);

  const load = async () => {
    const d = await fetchComplaintDetail(params.id);
    setData(d);
  };

  useEffect(() => {
    if (ready && session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session, params.id]);

  if (!ready || !session) return null;

  // Per section 7.1: authority approval moves the complaint to `resolved`,
  // but that's provisional until the citizen confirms — resolved -> [*] on
  // confirm, or resolved -> reopened on dispute. So the panel stays open
  // as long as there's an approved resolution with no citizen verdict yet.
  const showVerifyPanel =
    !!data?.resolution && data.resolution.review_status === "approved" && !data?.verification;

  const act = async (verdict: "confirmed" | "disputed") => {
    if (!data) return;
    setSubmitting(verdict);
    await submitVerification(data.complaint.id, verdict, comment);
    await load();
    setSubmitting(null);
  };

  return (
    <RoleShell role="citizen" roleLabel="Citizen" identityLabel={session.label} items={NAV} onLogout={logout}>
      {!data ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-ink-soft">Ref {data.complaint.derived_citizen_id}</p>
                <h1 className="mt-1 font-display text-2xl text-ink">
                  {data.complaint.description || "Civic complaint"}
                </h1>
              </div>
              <StatusBadge status={data.complaint.status} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs font-medium text-ink-soft">Filed — before</p>
                <img
                  src={data.complaint.before_photo_url}
                  alt="Before"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-ink-soft">
                  {data.resolution ? "Submitted — after" : "Awaiting completion"}
                </p>
                {data.resolution ? (
                  <img
                    src={data.resolution.after_photo_url}
                    alt="After"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-paper-line text-xs text-ink-soft">
                    No evidence yet
                  </div>
                )}
              </div>
            </div>

            {data.resolution && (
              <Card className="mt-4 p-4">
                <p className="text-xs font-medium text-ink-soft">Officer's note</p>
                <p className="mt-1 text-sm text-ink">{data.resolution.officer_note || "—"}</p>
                <p className="mt-3 truncate text-xs text-ink-soft">
                  Record hash <span className="font-mono">{data.resolution.record_hash.slice(0, 24)}…</span>
                </p>
              </Card>
            )}

            {showVerifyPanel && (
              <Card className="mt-4 p-4">
                <p className="font-display text-lg text-ink">Is this actually fixed?</p>
                <p className="mt-1 text-sm text-ink-soft">
                  The assigned authority has reviewed and approved this completion. You have the final word.
                </p>
                <TextArea
                  className="mt-3"
                  placeholder="Optional comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => act("confirmed")}
                    disabled={submitting !== null}
                    className="flex-1"
                  >
                    {submitting === "confirmed" ? "Confirming…" : "Confirm it's fixed"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => act("disputed")}
                    disabled={submitting !== null}
                    className="flex-1"
                  >
                    {submitting === "disputed" ? "Reopening…" : "Not actually fixed"}
                  </Button>
                </div>
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
