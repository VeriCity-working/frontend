"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { requestCitizenOtp, verifyCitizenOtp, USE_MOCKS } from "@/lib/api";
import { useAuthRole } from "@/lib/hooks/useAuthRole";

export default function CitizenLoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthRole();
  const router = useRouter();

  const sendOtp = async () => {
    setError(null);
    if (phone.trim().length < 7) {
      setError("Enter a valid phone number.");
      return;
    }
    setLoading(true);
    try {
      await requestCitizenOtp(phone.trim());
      setStage("otp");
    } catch (e: any) {
      setError(e.message ?? "Couldn't send the code.");
    } finally {
      setLoading(false);
    }
  };

  const confirmOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const { walletId } = await verifyCitizenOtp(phone.trim(), code.trim());
      login({ role: "citizen", id: walletId, label: `Wallet ${walletId.slice(-6)}` });
      router.push("/citizen/complaints");
    } catch (e: any) {
      setError(e.message ?? "That code didn't work.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">← Back</Link>
        <h1 className="mt-4 font-display text-2xl text-ink">Sign in as a citizen</h1>
        <p className="mt-1 text-sm text-ink-soft">
          We only ever ask for a phone number — no name, no email, no address. Your identity
          never appears anywhere a complaint is displayed.
        </p>

        <Card className="mt-6 p-6">
          {stage === "phone" ? (
            <div className="flex flex-col gap-4">
              <Input
                label="Phone number"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {error && <p className="text-sm text-brick">{error}</p>}
              <Button onClick={sendOtp} disabled={loading} fullWidth>
                {loading ? "Sending…" : "Send code"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Input
                label="Verification code"
                inputMode="numeric"
                placeholder="000000"
                hint={USE_MOCKS ? "Mock mode: use 000000." : "Sent by SMS."}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              {error && <p className="text-sm text-brick">{error}</p>}
              <Button onClick={confirmOtp} disabled={loading} fullWidth>
                {loading ? "Verifying…" : "Verify & continue"}
              </Button>
              <button
                onClick={() => setStage("phone")}
                className="text-sm text-ink-soft hover:text-ink"
              >
                Use a different number
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
