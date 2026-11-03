import { useState } from "react";
import { AlertTriangle, Building2 } from "lucide-react";
import { TopBar } from "../shared/TopBar";
import { supabase } from "../../lib/supabase";

export function ProviderSignup({ onCreated, onBack }: { onCreated: () => void; onBack: () => void }) {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setLoading(true);
    if (!supabase) { setError("Authentication is not configured."); setLoading(false); return; }
    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { organization_name: company.trim(), provider_signup: true } } });
    if (signUpError) setError(signUpError.message);
    else if (!data.session) setError("Check your email to confirm the provider account, then sign in.");
    else { localStorage.removeItem("loggedInClientId"); onCreated(); }
    setLoading(false);
  };
  return <div className="min-h-screen bg-background flex flex-col"><TopBar onBack={onBack} /><main className="flex-1 flex items-center justify-center px-6 py-16"><div className="w-full max-w-md"><div className="mb-8"><div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4"><Building2 className="w-5 h-5 text-primary" /></div><h1 className="text-2xl font-bold mb-1">Create provider account</h1><p className="text-muted-foreground text-sm">Your organization gets its own private client dashboard.</p></div><form onSubmit={submit} className="space-y-4"><div><label className="text-sm font-medium block mb-1.5">ISP or company name</label><input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm" required /></div><div><label className="text-sm font-medium block mb-1.5">Owner email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm" required /></div><div><label className="text-sm font-medium block mb-1.5">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm" required /></div>{error && <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}<button disabled={loading} className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60">{loading ? "Creating…" : "Create provider account"}</button></form></div></main></div>;
}
