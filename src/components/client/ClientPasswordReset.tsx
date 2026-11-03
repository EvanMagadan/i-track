import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { TopBar } from "../shared/TopBar";

export function ClientPasswordReset({ onBack }: { onBack: () => void }) {
  const [clientId, setClientId] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    const response = await fetch("/api/client-activation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset", clientId, activationCode: code, password }) });
    const result = await response.json();
    if (!response.ok) setError(result.message ?? "Could not reset password.");
    else setMessage("Password reset successfully. You can now sign in.");
  };
  return <div className="min-h-screen bg-background flex flex-col"><TopBar onBack={onBack} backLabel="Back to Login" /><main className="flex-1 flex items-center justify-center px-6 py-16"><form onSubmit={submit} className="w-full max-w-sm space-y-4"><h1 className="text-2xl font-bold">Reset client password</h1><p className="text-sm text-muted-foreground">Ask your provider for a new one-time reset code.</p><input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Client ID, e.g. JUAN-4821" className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border" required /><input value={code} onChange={e => setCode(e.target.value)} placeholder="One-time reset code" inputMode="numeric" className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border" required /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" minLength={6} className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border" required />{(error || message) && <div className={`text-sm rounded-lg px-3 py-2.5 ${error ? "text-destructive bg-destructive/10" : "text-green-700 bg-green-50 dark:bg-green-950/30"}`}>{error ? <AlertTriangle className="inline w-4 h-4 mr-2" /> : null}{error || message}</div>}<button className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold">Reset Password</button></form></main></div>;
}
