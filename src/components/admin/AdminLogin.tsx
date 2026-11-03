import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Settings } from "lucide-react";
import { TopBar } from "../shared/TopBar";
import { supabase } from "../../lib/supabase";

export function AdminLogin({ onLogin, onSignup, onBack }: { onLogin: () => void; onSignup: () => void; onBack: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const handleForgotPassword = async () => {
    setError(""); setResetMessage("");
    if (!supabase || !username.trim()) { setError("Enter your administrator email first."); return; }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(username.trim(), { redirectTo: window.location.origin });
    if (resetError) setError(resetError.message);
    else setResetMessage("If that account exists, a password reset link has been sent.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!supabase) {
      setError("Authentication is not configured.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: username.trim(),
      password,
    });

    if (authError) setError("Invalid administrator credentials.");
    else {
      localStorage.removeItem("loggedInClientId");
      onLogin();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar onBack={onBack} />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Admin Access</h1>
            <p className="text-muted-foreground text-sm">Restricted to authorized administrators only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Administrator email"
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
                  placeholder="Administrator password"
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
              {loading ? "Authenticating…" : "Access Admin Panel"}
            </button>
            <button type="button" onClick={() => void handleForgotPassword()} className="w-full text-sm text-primary font-semibold hover:underline">Forgot password?</button>
            <button type="button" onClick={onSignup} className="w-full text-sm text-primary font-semibold hover:underline">Create a provider account</button>
            {resetMessage && <p className="text-sm text-green-700 dark:text-green-300 text-center">{resetMessage}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}
