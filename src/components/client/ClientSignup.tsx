import { useState } from "react";
import { AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { TopBar } from "../shared/TopBar";
import type { Client } from "../../types";

export function ClientSignup({
  clients,
  onActivated,
  onBack,
}: {
  clients: Client[];
  onActivated: (c: Client, newPassword: string) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const match = clients.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (match) {
      setFoundClient(match);
      setStep(2);
      setError("");
    } else {
      setError("Name not found in our records. Check with your provider that you are pre-registered.");
    }
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (foundClient) onActivated(foundClient, password);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar onBack={onBack} backLabel="Back to Login" />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Account Activation</h1>
            <p className="text-muted-foreground text-sm">One-time setup for pre-registered clients.</p>
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
                <label className="text-sm font-medium block mb-1.5">Registered Client Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter the name your provider used"
                  className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  This must match exactly the name registered by your ISP.
                </p>
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
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-3 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Identity Verified</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Welcome, {foundClient?.name}. Set your private password below.
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
                Activate Account
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
