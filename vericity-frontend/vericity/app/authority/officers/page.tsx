"use client";

import { useEffect, useState } from "react";
import { RoleShell } from "@/components/layout/RoleShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { fetchAuthority, fetchOfficersForAuthority, provisionOfficer } from "@/lib/api";
import type { Officer } from "@/lib/types";

const NAV = [
  { href: "/authority/dashboard", label: "Queue" },
  { href: "/authority/officers", label: "Officers" },
  { href: "/authority/portfolio", label: "Portfolio" }
];

export default function OfficersPage() {
  const { session, ready, logout } = useRequireRole("authority");
  const [officers, setOfficers] = useState<Officer[] | null>(null);
  const [domainId, setDomainId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ officer: Officer; tempPassword: string } | null>(null);

  const load = async () => {
    if (!session) return;
    const authority = await fetchAuthority(session.id);
    setDomainId(authority?.domain_id ?? null);
    setOfficers(await fetchOfficersForAuthority(session.id));
  };

  useEffect(() => {
    if (ready && session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session]);

  if (!ready || !session) return null;

  const submit = async () => {
    if (!name.trim() || !domainId) return;
    setCreating(true);
    const result = await provisionOfficer(session.id, domainId, name.trim(), role.trim());
    setCreating(false);
    setCreated(result);
    setName("");
    setRole("");
    setOfficers((prev) => (prev ? [...prev, result.officer] : [result.officer]));
  };

  return (
    <RoleShell role="authority" roleLabel="Authority dashboard" identityLabel={session.label} items={NAV} onLogout={logout}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Officers</h1>
          <p className="mt-1 text-sm text-ink-soft">Everyone provisioned under {session.label}.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Close" : "Add officer"}</Button>
      </div>

      {showForm && (
        <Card className="mt-5 max-w-md p-5">
          {created ? (
            <div>
              <p className="font-display text-lg text-ink">Officer provisioned</p>
              <p className="mt-2 text-sm text-ink-soft">Share these credentials securely — they'll be forced to change the password on first login.</p>
              <div className="mt-3 rounded bg-paper p-3 font-mono text-sm">
                <p>Officer ID: {created.officer.officer_id}</p>
                <p>Temp password: {created.tempPassword}</p>
              </div>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => {
                  setCreated(null);
                  setShowForm(false);
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Input label="Officer name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. R. Nair" />
              <Input label="Role (optional)" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Field technician" />
              <Button onClick={submit} disabled={creating || !name.trim()}>
                {creating ? "Provisioning…" : "Create officer account"}
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {officers === null && <p className="text-sm text-ink-soft">Loading…</p>}
        {officers?.length === 0 && <EmptyState title="No officers yet" detail="Add your first officer to start assigning cases." />}
        {officers?.map((o) => (
          <Card key={o.id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">{o.name}</p>
              <span className={`h-2 w-2 rounded-full ${o.active ? "bg-verified" : "bg-ink/20"}`} />
            </div>
            <p className="text-xs text-ink-soft">{o.officer_id}{o.role ? ` · ${o.role}` : ""}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-ink-soft">
              <span>{o.open_case_count ?? 0} open case{(o.open_case_count ?? 0) === 1 ? "" : "s"}</span>
              <span>Score {o.performance_score ?? "—"}</span>
            </div>
          </Card>
        ))}
      </div>
    </RoleShell>
  );
}
