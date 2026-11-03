import { Settings } from "lucide-react";
import { ThemeToggle } from "../shared/ThemeToggle";

export function AdminSettings() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Workspace</p>
        <h1 className="text-2xl font-bold mt-1">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage preferences for your provider dashboard.</p>
      </div>
      <section className="bg-card border border-border rounded-xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Settings className="w-5 h-5 text-primary" /></div>
          <div className="flex-1">
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose the theme used on this device.</p>
            <div className="mt-4"><ThemeToggle /></div>
          </div>
        </div>
      </section>
    </div>
  );
}
