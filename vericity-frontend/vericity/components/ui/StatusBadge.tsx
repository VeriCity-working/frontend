import type { ComplaintStatus, VerificationVerdict, ReviewStatus } from "@/lib/types";

const STATUS_META: Record<ComplaintStatus, { label: string; tone: string }> = {
  filed: { label: "Filed", tone: "bg-ink/10 text-ink-soft" },
  assigned: { label: "Assigned", tone: "bg-steel-soft text-steel" },
  in_progress: { label: "In progress", tone: "bg-signal-soft text-signal" },
  work_completed: { label: "Work completed", tone: "bg-signal-soft text-signal" },
  under_review: { label: "Under authority review", tone: "bg-officer-soft text-officer" },
  resolved: { label: "Resolved", tone: "bg-verified-soft text-verified" },
  reopened: { label: "Reopened", tone: "bg-brick-soft text-brick" }
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${meta.tone}`}>
      {meta.label}
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: VerificationVerdict }) {
  const tone = verdict === "confirmed" ? "bg-verified-soft text-verified" : "bg-brick-soft text-brick";
  return (
    <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${tone}`}>
      {verdict === "confirmed" ? "Confirmed by citizen" : "Disputed by citizen"}
    </span>
  );
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const meta: Record<ReviewStatus, { label: string; tone: string }> = {
    pending: { label: "Pending review", tone: "bg-signal-soft text-signal" },
    approved: { label: "Approved", tone: "bg-verified-soft text-verified" },
    rejected: { label: "Rejected", tone: "bg-brick-soft text-brick" },
    reassigned: { label: "Reassigned", tone: "bg-officer-soft text-officer" }
  };
  const m = meta[status];
  return <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${m.tone}`}>{m.label}</span>;
}
