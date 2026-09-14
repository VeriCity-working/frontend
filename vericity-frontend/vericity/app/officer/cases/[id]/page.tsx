"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoleShell } from "@/components/layout/RoleShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LiveCameraCapture } from "@/components/camera/LiveCameraCapture";
import { ComplaintTimeline } from "@/components/status/ComplaintTimeline";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { acceptCase, completeCase, fetchComplaintDetail } from "@/lib/api";
import type { CaseAssignment, ComplaintPublic, Resolution, Verification } from "@/lib/types";

const NAV = [{ href: "/officer/cases", label: "My cases" }];

export default function OfficerCaseDetailPage() {
  const { session, ready, logout } = useRequireRole("officer");
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<{
    complaint: ComplaintPublic;
    assignment?: CaseAssignment;
    resolution?: Resolution;
    verification?: Verification;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [note, setNote] = useState("");
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [afterGeo, setAfterGeo] = useState<{ lat: number; long: number } | null>(null);

  const load = async () => {
    setData(await fetchComplaintDetail(params.id));
  };

  useEffect(() => {
    if (ready && session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session, params.id]);

  if (!ready || !session) return null;

  const accept = async () => {
    if (!data?.assignment) return;
    setBusy(true);
    await acceptCase(data.assignment.id);
    await load();
    setBusy(false);
  };

  const submitCompletion = async () => {
    if (!data?.assignment || !afterPhoto || !afterGeo) return;
    setBusy(true);
    await completeCase({
      assignmentId: data.assignment.id,
      complaintId: data.complaint.id,
      officerId: session.id,
      photoDataUrl: afterPhoto,
      note,
      lat: afterGeo.lat,
      long: afterGeo.long
    });
    setBusy(false);
    setCapturing(false);
    router.push("/officer/cases");
  };

  const canAccept = data?.assignment?.status === "assigned";
  const canWork = data?.assignment?.status === "in_progress" || data?.assignment?.status === "reopened";

  return (
    <RoleShell role="officer" roleLabel="Officer portal" identityLabel={session.label} items={NAV} onLogout={logout}>
      <button onClick={() => router.push("/officer/cases")} className="text-sm text-ink-soft hover:text-ink">
        ← Back to my cases
      </button>

      {!data ? (
        <p className="mt-4 text-sm text-ink-soft">Loading…</p>
      ) : (
        <div className="mt-3 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl text-ink">{data.complaint.description || "Civic complaint"}</h1>
              <StatusBadge status={data.complaint.status} />
            </div>

            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-ink-soft">What was reported</p>
              <img src={data.complaint.before_photo_url} alt="Before" className="aspect-video w-full rounded-lg object-cover" />
            </div>

            {canAccept && (
              <Card className="mt-5 p-5">
                <p className="font-display text-lg text-ink">Accept this case</p>
                <p className="mt-1 text-sm text-ink-soft">Accepting marks it in progress and starts your clock.</p>
                <Button onClick={accept} disabled={busy} className="mt-3">
                  {busy ? "Accepting…" : "Accept case"}
                </Button>
              </Card>
            )}

            {canWork && !capturing && (
              <Card className="mt-5 p-5">
                <p className="font-display text-lg text-ink">Submit completion proof</p>
                <p className="mt-1 text-sm text-ink-soft">
                  A live after-photo and your current GPS position — this becomes the hash-chained
                  record the authority reviews.
                </p>
                <Button onClick={() => setCapturing(true)} className="mt-3">
                  Capture after-photo
                </Button>
              </Card>
            )}

            {capturing && (
              <Card className="mt-5 p-5">
                {!afterPhoto ? (
                  <LiveCameraCapture
                    onCapture={(photo, geo) => {
                      setAfterPhoto(photo);
                      setAfterGeo(geo);
                    }}
                  />
                ) : (
                  <div>
                    <img src={afterPhoto} alt="Captured after-photo" className="aspect-[4/3] w-full rounded-lg object-cover" />
                    <TextArea
                      className="mt-3"
                      label="Note for the authority"
                      placeholder="What did you do to resolve this?"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setAfterPhoto(null);
                          setAfterGeo(null);
                        }}
                      >
                        Retake
                      </Button>
                      <Button className="flex-1" onClick={submitCompletion} disabled={busy}>
                        {busy ? "Submitting…" : "Submit evidence"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {data.resolution && (
              <Card className="mt-5 p-5">
                <p className="font-display text-lg text-ink">Your submitted evidence</p>
                <img src={data.resolution.after_photo_url} alt="After" className="mt-2 aspect-video w-full rounded-lg object-cover" />
                <p className="mt-2 text-sm text-ink-soft">{data.resolution.officer_note}</p>
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
