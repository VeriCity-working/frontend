/**
 * ============================================================================
 * VeriCity API layer
 * ============================================================================
 *
 * Every call the frontend makes to the backend goes through this one file,
 * mirroring section 6 (API design) of VeriCity_System_Design.md. Right now,
 * with no Supabase project connected, every function below runs against the
 * in-memory mock store in lib/mockStore.ts, so `npm run dev` works out of
 * the box with realistic data.
 *
 * TO CONNECT YOUR REAL BACKEND:
 *   1. Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
 *      .env.local (copy .env.local.example). HAS_SUPABASE flips to true.
 *   2. In each function below, delete the "MOCK" branch's body and uncomment
 *      the "REAL" block above it. Each REAL block is the exact call implied
 *      by section 6's endpoint table — copy/paste and adjust names to match
 *      whatever you actually called your Edge Functions / tables.
 *   3. Deploy the Edge Functions from supabase/functions (section 2.3) and
 *      run the migrations from section 3 first, or these will 404.
 *
 * Nothing outside this file should import supabaseClient directly — keep
 * every component talking to `api`, so swapping mock <-> real is one file.
 * ============================================================================
 */

import { HAS_SUPABASE, supabase } from "./supabaseClient";
import { sha256Hex } from "./hash";
import {
  authorities,
  caseAssignments,
  complaints,
  currentWallet,
  domains,
  findAuthority,
  findOfficer,
  officers,
  resolutions,
  verifications
} from "./mockStore";
import type {
  CaseAssignment,
  ComplaintPublic,
  ComplaintStatus,
  Officer,
  PriorityLevel,
  Resolution,
  Verification,
  VerificationVerdict
} from "./types";

export const USE_MOCKS = !HAS_SUPABASE;

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const genId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

// ─────────────────────────────────────────────────────────────────────────
// AUTH — citizen phone OTP, authority email/password, officer ID/password
// ─────────────────────────────────────────────────────────────────────────

export async function requestCitizenOtp(phone: string): Promise<void> {
  if (!USE_MOCKS && supabase) {
    // REAL — Supabase-managed phone OTP (section 5, Citizen row)
    // const { error } = await supabase.auth.signInWithOtp({ phone });
    // if (error) throw error;
    return;
  }
  await delay();
  console.info(`[mock] OTP sent to ${phone}. Use code 000000 to continue.`);
}

export async function verifyCitizenOtp(
  phone: string,
  code: string
): Promise<{ walletId: string }> {
  if (!USE_MOCKS && supabase) {
    // REAL:
    // const { data, error } = await supabase.auth.verifyOtp({
    //   phone,
    //   token: code,
    //   type: "sms"
    // });
    // if (error) throw error;
    // // Fires otp-verify-hook server-side to ensure citizen_wallets exists.
    // await supabase.functions.invoke("otp-verify-hook");
    // return { walletId: data.user!.id };
    return { walletId: "" };
  }
  await delay();
  if (code !== "000000") throw new Error("Invalid code. (Mock code is 000000.)");
  return { walletId: currentWallet.wallet_id };
}

export async function signInAuthority(
  email: string,
  password: string
): Promise<{ authorityId: string; mustResetPassword: boolean }> {
  if (!USE_MOCKS && supabase) {
    // REAL:
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // if (error) throw error;
    // const meta = data.user!.user_metadata as { must_reset_password?: boolean };
    // return { authorityId: data.user!.id, mustResetPassword: !!meta.must_reset_password };
    return { authorityId: "", mustResetPassword: false };
  }
  await delay();
  const prefix = email.toLowerCase().split("@")[0];
  const aliasMap: Record<string, string> = {
    pwd: "auth-pwd",
    electric: "auth-electric",
    water: "auth-water",
    swachhcorp: "auth-waste"
  };
  const authorityId = aliasMap[prefix] ?? authorities[0].id;
  return { authorityId, mustResetPassword: false };
}

export async function signInOfficer(
  officerId: string,
  password: string
): Promise<{ id: string; mustResetPassword: boolean }> {
  if (!USE_MOCKS && supabase) {
    // REAL — the frontend maps "Officer ID" to the synthetic email the
    // provision-officer function generated (section 5): off-1042@officers.vericity.app
    // const syntheticEmail = `${officerId.toLowerCase()}@officers.vericity.app`;
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email: syntheticEmail,
    //   password
    // });
    // if (error) throw error;
    // const meta = data.user!.user_metadata as { must_reset_password?: boolean };
    // return { id: data.user!.id, mustResetPassword: !!meta.must_reset_password };
    return { id: "", mustResetPassword: false };
  }
  await delay();
  const officer = officers.find((o) => o.officer_id.toLowerCase() === officerId.toLowerCase());
  if (!officer) throw new Error("Unknown Officer ID. Try OFF-1042.");
  return { id: officer.id, mustResetPassword: false };
}

export async function changePassword(_newPassword: string): Promise<void> {
  if (!USE_MOCKS && supabase) {
    // REAL — POST /functions/v1/auth/password/change
    // const { error } = await supabase.functions.invoke("auth-password-change", {
    //   body: { newPassword: _newPassword }
    // });
    // if (error) throw error;
    return;
  }
  await delay();
}

// ─────────────────────────────────────────────────────────────────────────
// CITIZEN
// ─────────────────────────────────────────────────────────────────────────

export interface FileComplaintInput {
  domainId: string;
  description: string;
  photoDataUrl: string; // captured live from LiveCameraCapture
  lat: number;
  long: number;
}

export async function checkNearbyDuplicates(
  domainId: string,
  lat: number,
  long: number
): Promise<ComplaintPublic[]> {
  if (!USE_MOCKS && supabase) {
    // REAL — GET /functions/v1/complaints/nearby (section 8.1: 75m / 30 days)
    // const { data, error } = await supabase.functions.invoke("complaints-nearby", {
    //   body: { domainId, lat, long }
    // });
    // if (error) throw error;
    // return data as ComplaintPublic[];
    return [];
  }
  await delay(250);
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  return complaints.filter((c) => {
    if (c.domain_id !== domainId || c.status === "resolved") return false;
    const dLat = toRad(c.lat - lat);
    const dLon = toRad(c.long - long);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(c.lat)) * Math.sin(dLon / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= 75;
  });
}

export async function fileComplaint(input: FileComplaintInput): Promise<ComplaintPublic> {
  if (!USE_MOCKS && supabase) {
    // REAL — POST /functions/v1/complaints (runs duplicate-check, derives
    // derived_citizen_id via HMAC, writes the row — section 4.2)
    // const { data, error } = await supabase.functions.invoke("complaints-create", {
    //   body: input
    // });
    // if (error) throw error;
    // return data as ComplaintPublic;
    return complaints[0];
  }
  await delay(600);
  const id = genId("c");
  const record: ComplaintPublic = {
    id,
    derived_citizen_id: (await sha256Hex(currentWallet.wallet_id + id)).slice(0, 10),
    domain_id: input.domainId,
    description: input.description || null,
    before_photo_url: input.photoDataUrl,
    lat: input.lat,
    long: input.long,
    status: "filed",
    assigned_authority_id: authorities.find((a) => a.domain_id === input.domainId)?.id ?? null,
    duplicate_of: null,
    upvote_count: 0,
    created_at: new Date().toISOString()
  };
  complaints.unshift(record);
  currentWallet.filed_complaint_ids.unshift(id);
  return record;
}

export async function upvoteComplaint(
  complaintId: string,
  _photoDataUrl: string,
  _lat: number,
  _long: number
): Promise<void> {
  if (!USE_MOCKS && supabase) {
    // REAL — POST /functions/v1/complaints/:id/upvote
    // const { error } = await supabase.functions.invoke(`complaints-upvote`, {
    //   body: { complaintId, photoDataUrl: _photoDataUrl, lat: _lat, long: _long }
    // });
    // if (error) throw error;
    return;
  }
  await delay();
  const c = complaints.find((x) => x.id === complaintId);
  if (c) c.upvote_count += 1;
}

export async function fetchMyComplaints(): Promise<ComplaintPublic[]> {
  if (!USE_MOCKS && supabase) {
    // REAL — direct PostgREST read, RLS-scoped to the caller's wallet_id
    // (section 6.2): the citizen's own rows come straight off `complaints`.
    // const { data, error } = await supabase
    //   .from("complaints")
    //   .select("*")
    //   .order("created_at", { ascending: false });
    // if (error) throw error;
    // return data as ComplaintPublic[];
    return [];
  }
  await delay();
  return complaints.filter((c) => currentWallet.filed_complaint_ids.includes(c.id));
}

export async function fetchComplaintDetail(id: string): Promise<{
  complaint: ComplaintPublic;
  assignment?: CaseAssignment;
  resolution?: Resolution;
  verification?: Verification;
}> {
  if (!USE_MOCKS && supabase) {
    // REAL:
    // const [{ data: complaint }, { data: assignment }, { data: resolution }, { data: verification }] =
    //   await Promise.all([
    //     supabase.from("complaints_public").select("*").eq("id", id).single(),
    //     supabase.from("case_assignments").select("*").eq("complaint_id", id).maybeSingle(),
    //     supabase.from("resolutions").select("*").eq("complaint_id", id).maybeSingle(),
    //     supabase.from("verifications").select("*").eq("complaint_id", id).maybeSingle()
    //   ]);
    throw new Error("not implemented");
  }
  await delay();
  const complaint = complaints.find((c) => c.id === id);
  if (!complaint) throw new Error("Complaint not found");
  return {
    complaint,
    assignment: caseAssignments.find((a) => a.complaint_id === id),
    resolution: resolutions.find((r) => r.complaint_id === id),
    verification: verifications.find((v) => v.complaint_id === id)
  };
}

export async function submitVerification(
  complaintId: string,
  verdict: VerificationVerdict,
  comment: string
): Promise<void> {
  if (!USE_MOCKS && supabase) {
    // REAL — POST /functions/v1/complaints/:id/verify (also updates
    // reputation per section 4.4: +2 confirmed / -6 disputed)
    // const { error } = await supabase.functions.invoke("complaints-verify", {
    //   body: { complaintId, verdict, comment }
    // });
    // if (error) throw error;
    return;
  }
  await delay();
  const complaint = complaints.find((c) => c.id === complaintId);
  if (!complaint) return;
  verifications.push({
    id: genId("ver"),
    complaint_id: complaintId,
    derived_citizen_id: complaint.derived_citizen_id,
    verdict,
    comment: comment || null,
    created_at: new Date().toISOString()
  });
  complaint.status = verdict === "confirmed" ? "resolved" : "reopened";
  currentWallet.reputation_score = Math.max(
    0,
    Math.min(100, currentWallet.reputation_score + (verdict === "confirmed" ? 2 : -6))
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AUTHORITY
// ─────────────────────────────────────────────────────────────────────────

export async function fetchDomains() {
  if (!USE_MOCKS && supabase) {
    // REAL: const { data } = await supabase.from("domains").select("*"); return data;
    return [];
  }
  await delay(150);
  return domains;
}

export async function fetchAuthority(authorityId: string) {
  if (!USE_MOCKS && supabase) {
    // REAL: supabase.from("authorities").select("*").eq("id", authorityId).single()
    return undefined;
  }
  await delay(150);
  return findAuthority(authorityId);
}

export async function fetchAuthorityQueue(authorityId: string): Promise<ComplaintPublic[]> {
  if (!USE_MOCKS && supabase) {
    // REAL — RLS policy `authority_read_domain` (section 5.1) already scopes
    // this to the authority's mapped domain, so a plain select is enough:
    // const { data, error } = await supabase
    //   .from("complaints")
    //   .select("*")
    //   .order("created_at", { ascending: false });
    // if (error) throw error;
    // return data as ComplaintPublic[];
    return [];
  }
  await delay();
  return complaints
    .filter((c) => c.assigned_authority_id === authorityId || findAuthority(authorityId)?.domain_id === c.domain_id)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export async function fetchOfficersForAuthority(authorityId: string): Promise<Officer[]> {
  if (!USE_MOCKS && supabase) {
    // REAL: supabase.from("officers").select("*").eq("authority_id", authorityId)
    return [];
  }
  await delay();
  return officers.filter((o) => o.authority_id === authorityId);
}

export async function provisionOfficer(
  authorityId: string,
  domainId: string,
  name: string,
  role: string
): Promise<{ officer: Officer; tempPassword: string }> {
  if (!USE_MOCKS && supabase) {
    // REAL — POST /functions/v1/authority/officers (provision-officer):
    // generates Officer ID + temp password, creates the Auth account with
    // a synthetic email and must_reset_password: true.
    // const { data, error } = await supabase.functions.invoke("authority-officers-create", {
    //   body: { authorityId, domainId, name, role }
    // });
    // if (error) throw error;
    // return data as { officer: Officer; tempPassword: string };
    throw new Error("not implemented");
  }
  await delay(500);
  const nextNum = 1000 + officers.length + Math.floor(Math.random() * 900);
  const officer: Officer = {
    id: genId("off"),
    officer_id: `OFF-${nextNum}`,
    name,
    role,
    authority_id: authorityId,
    domain_id: domainId,
    active: true,
    open_case_count: 0,
    performance_score: 50
  };
  officers.push(officer);
  return { officer, tempPassword: Math.random().toString(36).slice(2, 10) };
}

export async function fetchAssignmentSuggestions(complaintId: string): Promise<Officer[]> {
  if (!USE_MOCKS && supabase) {
    // REAL — GET /functions/v1/authority/assignments/suggestions (section 8.2):
    // score = 0.6*performance - 0.3*open_cases - 0.1*days_since_last_assignment_inverse
    // const { data, error } = await supabase.functions.invoke("authority-assignments-suggest", {
    //   body: { complaintId }
    // });
    // if (error) throw error;
    // return data as Officer[];
    return [];
  }
  await delay(400);
  const complaint = complaints.find((c) => c.id === complaintId);
  if (!complaint) return [];
  return officers
    .filter((o) => o.domain_id === complaint.domain_id && o.active)
    .map((o) => ({
      ...o,
      _score:
        0.6 * (o.performance_score ?? 50) - 0.3 * (o.open_case_count ?? 0) * 10
    }))
    .sort((a: any, b: any) => b._score - a._score)
    .slice(0, 3);
}

export async function createAssignment(
  complaintId: string,
  officerId: string,
  authorityId: string,
  priority: PriorityLevel,
  deadline: string | null
): Promise<CaseAssignment> {
  if (!USE_MOCKS && supabase) {
    // REAL — POST /functions/v1/authority/assignments
    // const { data, error } = await supabase.functions.invoke("authority-assignments-create", {
    //   body: { complaintId, officerId, priority, deadline }
    // });
    // if (error) throw error;
    // return data as CaseAssignment;
    throw new Error("not implemented");
  }
  await delay(400);
  const assignment: CaseAssignment = {
    id: genId("ca"),
    complaint_id: complaintId,
    officer_id: officerId,
    assigned_by: authorityId,
    assigned_at: new Date().toISOString(),
    deadline,
    priority,
    status: "assigned"
  };
  caseAssignments.push(assignment);
  const complaint = complaints.find((c) => c.id === complaintId);
  if (complaint) complaint.status = "assigned" as ComplaintStatus;
  const officer = officers.find((o) => o.id === officerId);
  if (officer) officer.open_case_count = (officer.open_case_count ?? 0) + 1;
  return assignment;
}

export async function reviewResolution(
  complaintId: string,
  decision: "approved" | "rejected" | "reassigned",
  authorityId: string
): Promise<void> {
  if (!USE_MOCKS && supabase) {
    // REAL — POST /functions/v1/authority/assignments/:id/review
    // const { error } = await supabase.functions.invoke("authority-assignments-review", {
    //   body: { complaintId, decision }
    // });
    // if (error) throw error;
    return;
  }
  await delay(400);
  const resolution = resolutions.find((r) => r.complaint_id === complaintId);
  const complaint = complaints.find((c) => c.id === complaintId);
  const assignment = caseAssignments.find((a) => a.complaint_id === complaintId);
  if (resolution) {
    resolution.review_status = decision;
    resolution.reviewed_by = authorityId;
    resolution.reviewed_at = new Date().toISOString();
  }
  if (complaint) {
    complaint.status = decision === "approved" ? "resolved" : "reopened";
  }
  if (assignment) {
    assignment.status = decision === "approved" ? "resolved" : "reopened";
  }
}

// ─────────────────────────────────────────────────────────────────────────
// OFFICER
// ─────────────────────────────────────────────────────────────────────────

export async function fetchOfficerCases(officerId: string): Promise<
  { complaint: ComplaintPublic; assignment: CaseAssignment }[]
> {
  if (!USE_MOCKS && supabase) {
    // REAL — RLS policy `officer_read_assigned` (section 5.1) scopes this
    // automatically:
    // const { data, error } = await supabase
    //   .from("case_assignments")
    //   .select("*, complaints(*)")
    //   .eq("officer_id", officerId);
    // if (error) throw error;
    return [];
  }
  await delay();
  return caseAssignments
    .filter((a) => a.officer_id === officerId)
    .map((assignment) => ({
      assignment,
      complaint: complaints.find((c) => c.id === assignment.complaint_id)!
    }))
    .filter((x) => x.complaint);
}

export async function acceptCase(assignmentId: string): Promise<void> {
  if (!USE_MOCKS && supabase) {
    // REAL — POST /functions/v1/officer/cases/:id/accept
    // const { error } = await supabase.functions.invoke("officer-cases-accept", {
    //   body: { assignmentId }
    // });
    // if (error) throw error;
    return;
  }
  await delay(300);
  const a = caseAssignments.find((x) => x.id === assignmentId);
  if (a) a.status = "in_progress";
  const c = complaints.find((x) => x.id === a?.complaint_id);
  if (c) c.status = "in_progress";
}

export interface CompleteCaseInput {
  assignmentId: string;
  complaintId: string;
  officerId: string;
  photoDataUrl: string;
  note: string;
  lat: number;
  long: number;
}

export async function completeCase(input: CompleteCaseInput): Promise<Resolution> {
  if (!USE_MOCKS && supabase) {
    // REAL — POST /functions/v1/officer/cases/:id/complete (resolution-submit):
    // computes the chained SHA-256 record_hash server-side (section 11.3).
    // const { data, error } = await supabase.functions.invoke("officer-cases-complete", {
    //   body: input
    // });
    // if (error) throw error;
    // return data as Resolution;
    throw new Error("not implemented");
  }
  await delay(600);
  const photoHash = await sha256Hex(input.photoDataUrl.slice(0, 5000));
  const prior = resolutions.filter((r) => r.complaint_id === input.complaintId);
  const previousHash = prior.length ? prior[prior.length - 1].record_hash : "genesis";
  const record_hash = await sha256Hex(
    [input.complaintId, input.officerId, photoHash, input.lat, input.long, previousHash].join("|")
  );
  const resolution: Resolution = {
    id: genId("res"),
    complaint_id: input.complaintId,
    officer_id: input.officerId,
    after_photo_url: input.photoDataUrl,
    lat: input.lat,
    long: input.long,
    resolved_at: new Date().toISOString(),
    officer_note: input.note || null,
    record_hash,
    review_status: "pending",
    reviewed_by: null,
    reviewed_at: null
  };
  resolutions.push(resolution);
  const assignment = caseAssignments.find((a) => a.id === input.assignmentId);
  if (assignment) assignment.status = "authority_review";
  const complaint = complaints.find((c) => c.id === input.complaintId);
  if (complaint) complaint.status = "under_review";
  return resolution;
}

export { findAuthority, findOfficer };
