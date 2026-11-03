import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, User } from "lucide-react";
import { TopBar } from "../shared/TopBar";
import { supabase } from "../../lib/supabase";
import type { Client } from "../../types";

export function ClientLogin({
  onLogin,
  onSignup,
  onBack,
  onReset,
}: {
  onLogin: (c: Client) => void;
  onSignup: () => void;
  onBack: () => void;
  onReset: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase client is not initialized.");
      }

      const { data, error: rpcError } = await supabase.auth.signInWithPassword({ email: `${clientId.trim().toLowerCase()}@clients.i-track.local`, password });

      if (rpcError) {
        throw new Error(rpcError.message === "Invalid login credentials" ? "Invalid Client ID or password." : rpcError.message);
      }
      const profileResponse = await fetch("/api/client-profile", { headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } });
      const profileResult = await profileResponse.json();
      if (!profileResponse.ok) {
        await supabase.auth.signOut();
        throw new Error(profileResult.message ?? "Your client profile could not be loaded.");
      }
      const client = profileResult.client;
      onLogin({
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
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar onBack={onBack} />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Client Login</h1>
            <p className="text-muted-foreground text-sm">
              Access your billing account and payment history.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Client ID</label>
              <input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Example: JUAN-4821"
                autoComplete="username"
                className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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

            {error && (
              <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 active:opacity-80 transition disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <button onClick={onReset} className="w-full mt-4 text-sm text-primary font-semibold hover:underline">Forgot password?</button>

          <p className="text-sm text-muted-foreground text-center mt-6">
            <button onClick={onSignup} className="text-primary font-semibold hover:underline">
              First time here? Activate your account
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
