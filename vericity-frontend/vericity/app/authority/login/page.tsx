"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { signInAuthority, fetchAuthority } from "@/lib/api";
import { useAuthRole } from "@/lib/hooks/useAuthRole";

export default function AuthorityLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthRole();
  const router = useRouter();

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const { authorityId } = await signInAuthority(email.trim(), password);
      const authority = await fetchAuthority(authorityId);
      login({
        role: "authority",
        id: authorityId,
        label: authority?.name ?? "Authority admin"
      });
      router.push("/authority/dashboard");
    } catch (e: any) {
      setError(e.message ?? "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">← Back</Link>
        <h1 className="mt-4 font-display text-2xl text-ink">Authority sign in</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Admin-issued credentials only — authorities don't self-register.
        </p>

        <Card className="mt-6 p-6">
          <div className="flex flex-col gap-4">
            <Input label="Work email" type="email" placeholder="pwd@city.gov" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-ink-soft">
              Mock mode: try <span className="font-mono">pwd@city.gov</span>, <span className="font-mono">electric@city.gov</span>,{" "}
              <span className="font-mono">water@city.gov</span>, or <span className="font-mono">swachhcorp@city.gov</span> with any password.
            </p>
            {error && <p className="text-sm text-brick">{error}</p>}
            <Button onClick={submit} disabled={loading} fullWidth>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
