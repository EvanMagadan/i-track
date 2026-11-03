import { ChevronRight, Settings, User, Wifi } from "lucide-react";

export function Landing({
  onClientPortal,
  onAdminPanel,
}: {
  onClientPortal: () => void;
  onAdminPanel: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-6 py-3.5 flex items-center gap-2">
        <Wifi className="w-5 h-5 text-primary" />
        <span className="font-bold tracking-tight">I-Track</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 gap-10">
        <div className="text-center max-w-xl">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">Internet service billing made simple</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Your account, clearly tracked.</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            I-Track helps clients check their plan, due date, and payment history while giving service teams a clear view of billing and account status.
          </p>
        </div>

        <button
          onClick={onClientPortal}
          className="group w-full max-w-sm bg-primary text-primary-foreground rounded-2xl p-8 text-left hover:opacity-95 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.99] transition-all duration-150"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-5">
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-1">Client Portal</h2>
          <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
            View your account, plan, due date, and payment records.
          </p>
          <div className="flex items-center text-white text-sm font-semibold">
          <span>Open your account</span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={onAdminPanel}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <Settings className="w-3 h-3" />
          <span>Admin Portal</span>
        </button>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        I-Track v1.0.0
      </footer>
    </div>
  );
}
