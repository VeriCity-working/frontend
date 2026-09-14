"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleShell } from "@/components/layout/RoleShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Input";
import { LiveCameraCapture } from "@/components/camera/LiveCameraCapture";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import {
  checkNearbyDuplicates,
  fetchDomains,
  fileComplaint,
  upvoteComplaint
} from "@/lib/api";
import type { ComplaintPublic, Domain } from "@/lib/types";

const NAV = [
  { href: "/citizen/file", label: "File a complaint" },
  { href: "/citizen/complaints", label: "My complaints" }
];

type Step = "domain" | "capture" | "duplicates" | "describe" | "done";

export default function FileComplaintPage() {
  const { session, ready, logout } = useRequireRole("citizen");
  const router = useRouter();

  const [domains, setDomains] = useState<Domain[]>([]);
  const [step, setStep] = useState<Step>("domain");
  const [domainId, setDomainId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat: number; long: number } | null>(null);
  const [duplicates, setDuplicates] = useState<ComplaintPublic[]>([]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filed, setFiled] = useState<ComplaintPublic | null>(null);

  useEffect(() => {
    fetchDomains().then((d) => (Array.isArray(d) && d.length ? setDomains(d) : null));
  }, []);

  // Fallback labels if fetchDomains returns [] in a not-yet-wired real backend.
  const displayDomains = domains.length
    ? domains
    : [
        { id: "dom-road", name: "Road" },
        { id: "dom-streetlight", name: "Streetlight" },
        { id: "dom-water", name: "Water" },
        { id: "dom-waste", name: "Waste" }
      ];

  if (!ready || !session) return null;

  const handleCapture = async (photoDataUrl: string, g: { lat: number; long: number }) => {
    setPhoto(photoDataUrl);
    setGeo(g);
    if (!domainId) return;
    const dupes = await checkNearbyDuplicates(domainId, g.lat, g.long);
    if (dupes.length) {
      setDuplicates(dupes);
      setStep("duplicates");
    } else {
      setStep("describe");
    }
  };

  const addProofToExisting = async (complaintId: string) => {
    if (!photo || !geo) return;
    setSubmitting(true);
    await upvoteComplaint(complaintId, photo, geo.lat, geo.long);
    setSubmitting(false);
    router.push(`/citizen/complaints/${complaintId}`);
  };

  const submit = async () => {
    if (!domainId || !photo || !geo) return;
    setSubmitting(true);
    const record = await fileComplaint({ domainId, description, photoDataUrl: photo, lat: geo.lat, long: geo.long });
    setSubmitting(false);
    setFiled(record);
    setStep("done");
  };

  return (
    <RoleShell
      role="citizen"
      roleLabel="Citizen"
      identityLabel={session.label}
      items={NAV}
      onLogout={logout}
    >
      <h1 className="font-display text-2xl text-ink">File a complaint</h1>
      <p className="mt-1 text-sm text-ink-soft">
        A live photo and your current location — that's the whole report. No account details
        ever attach to it.
      </p>

      <div className="mt-6 max-w-xl">
        {step === "domain" && (
          <Card className="p-6">
            <p className="text-sm font-medium text-ink-soft">What kind of issue is this?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {displayDomains.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDomainId(d.id);
                    setStep("capture");
                  }}
                  className="rounded border border-paper-line bg-paper px-4 py-3 text-left text-sm font-medium text-ink hover:border-ink"
                >
                  {d.name}
                </button>
              ))}
            </div>
          </Card>
        )}

        {step === "capture" && (
          <Card className="p-6">
            <p className="text-sm font-medium text-ink-soft">
              Capture live evidence — gallery photos aren't accepted
            </p>
            <div className="mt-3">
              <LiveCameraCapture onCapture={handleCapture} />
            </div>
          </Card>
        )}

        {step === "duplicates" && (
          <Card className="p-6">
            <p className="font-display text-lg text-ink">Similar reports nearby</p>
            <p className="mt-1 text-sm text-ink-soft">
              {duplicates.length} open complaint{duplicates.length > 1 ? "s" : ""} already exist within
              75m of this spot. Add your photo as extra proof, or file a new report anyway.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {duplicates.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded border border-paper-line p-3">
                  <img src={d.before_photo_url} alt="" className="h-14 w-14 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-sm text-ink">{d.description || "No description provided"}</p>
                    <p className="text-xs text-ink-soft">{d.upvote_count} citizen{d.upvote_count === 1 ? "" : "s"} confirmed this</p>
                  </div>
                  <Button variant="secondary" onClick={() => addProofToExisting(d.id)} disabled={submitting}>
                    Add my proof
                  </Button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep("describe")}
              className="mt-4 text-sm text-ink-soft underline hover:text-ink"
            >
              None of these — file a new report
            </button>
          </Card>
        )}

        {step === "describe" && (
          <Card className="p-6">
            <div className="mb-4 aspect-[4/3] w-full overflow-hidden rounded">
              {photo && <img src={photo} alt="Captured evidence" className="h-full w-full object-cover" />}
            </div>
            <TextArea
              label="What's going on here? (optional but helpful)"
              placeholder="e.g. Deep pothole widening after last week's rain…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button onClick={submit} disabled={submitting} fullWidth className="mt-4">
              {submitting ? "Filing…" : "File complaint"}
            </Button>
          </Card>
        )}

        {step === "done" && filed && (
          <Card className="p-6 text-center">
            <p className="font-display text-xl text-ink">Filed</p>
            <p className="mt-1 text-sm text-ink-soft">
              Reference <span className="font-mono">{filed.derived_citizen_id}</span> — you can follow its
              progress any time.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => router.push("/citizen/complaints")}>
                My complaints
              </Button>
              <Button onClick={() => router.push(`/citizen/complaints/${filed.id}`)}>View status</Button>
            </div>
          </Card>
        )}
      </div>
    </RoleShell>
  );
}
