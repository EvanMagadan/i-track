import { useState } from "react";
import { AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { TopBar } from "../shared/TopBar";
import type { Client } from "../../types";
import { supabase } from "../../lib/supabase";

export function ClientSignup({
  onActivated,
  onBack,
}: {
  onActivated: (c: Client) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [clientId, setClientId] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedId = clientId.trim().toUpperCase();
    const match = /^(?:CLI-[A-Z0-9-]+|[A-Z0-9]+-[0-9]{4})$/.test(normalizedId)
      ? ({ id: normalizedId, name: normalizedId } as Client)
      : null;
    if (match) {
      setFoundClient(match);
      setStep(2);
      setError("");
    } else {
      setError("Enter the Client ID printed on your activation instructions.");
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!foundClient || !supabase) return;
    setError("");
    const response = await fetch("/api/client-activation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "consume", clientId: foundClient.id, activationCode, password }) });
    const activation = await response.json();
    if (!response.ok) { setError(activation.message ?? "Invalid activation code"); return; }
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: `${activation.login}@clients.i-track.local`,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    if (!data.session) {
      setError("Account created. Sign in with your Client ID and new password.");
      return;
    }
    if (!data.user) {
      setError("Account created, but the session was not returned. Please sign in with your Client ID and password.");
      return;
    }
    const profileResponse = await fetch("/api/client-profile", { headers: { Authorization: `Bearer ${data.session.access_token}` } });
    const profileResult = await profileResponse.json();
    if (!profileResponse.ok) {
      setError(profileResult.message ?? "Account created, but your client profile could not be loaded. Please sign in again.");
      return;
    }
    const client = profileResult.client;
    onActivated({
      id: client.id,
      email: client.email ?? "",
      name: client.name,
      address: client.address ?? "",
      plan: Number(client.plan ?? 0),
      phone: client.phone ?? "",
      installDate: client.install_date ?? "",
      dueDate: client.due_date ?? "",
      status: client.status ?? "active",
      payments: Array.isArray(client.payments) ? client.payments : [],
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar onBack={onBack} backLabel="Back to Login" />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Activate Client Account</h1>
            <div className="flex gap-2 mt-4">
              {([1, 2] as const).map((s) => (
                <div
                  key={s}
                  className={`h-1 rounded-full flex-1 transition-colors duration-300 ${step >= s ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Example: JUAN-4821"
                  className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Use the Client ID and one-time activation code provided by your ISP.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Activation Code</label>
                <input type="text" value={activationCode} onChange={(e) => setActivationCode(e.target.value)} required inputMode="numeric" className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm" />
              </div>
              {error && (
                <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition"
              >
                Verify Identity
              </button>
            </form>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-900 rounded-lg px-3 py-3 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">Identity Verified</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                    Welcome, {foundClient?.name}. Create your secure account password below.
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                  required
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition"
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
