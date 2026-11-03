import { Activity, ChevronRight, CircleCheck, Settings, User, Wifi } from "lucide-react";
import { ThemeToggle } from "../shared/ThemeToggle";

export function Landing({ onClientPortal, onAdminPanel }: { onClientPortal: () => void; onAdminPanel: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <header className="border-b border-border bg-card/90 backdrop-blur px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2"><Wifi className="w-5 h-5 text-primary" /><span className="font-bold tracking-tight">I-Track</span></div>
        <div className="flex items-center gap-3"><span className="hidden sm:block text-xs text-muted-foreground">Service account portal</span><ThemeToggle /></div>
      </header>
      <main className="relative flex-1 grid lg:grid-cols-[1.05fr_0.95fr] items-center gap-12 px-6 sm:px-10 lg:px-20 py-12 lg:py-20 max-w-7xl w-full mx-auto">
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <section className="relative max-w-2xl animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-5"><Activity className="w-3.5 h-3.5" /> Internet service billing made simple</div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-5 leading-[1.05]">Your account, clearly tracked.</h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mb-8">I-Track helps clients check their plan, due date, and payment history while giving service teams a clear view of billing and account status.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={onClientPortal} className="group bg-primary text-primary-foreground rounded-xl px-5 py-3.5 text-left hover:opacity-95 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.99] transition-all duration-150"><div className="flex items-center text-white text-sm font-semibold"><User className="w-4 h-4 mr-2" /><span>Open Client Portal</span><ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></div></button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><CircleCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure account access</span><span className="flex items-center gap-1.5"><CircleCheck className="w-3.5 h-3.5 text-emerald-600" /> Clear payment history</span></div>
        </section>
        <section className="relative hidden lg:block animate-fade-in" aria-label="I-Track dashboard preview">
          <div className="relative rounded-[2rem] bg-slate-950 p-5 shadow-2xl shadow-primary/15 rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border border-primary/30 animate-pulse-ring" />
            <div className="flex items-center justify-between text-white/60 text-xs mb-5"><span className="flex items-center gap-2"><Wifi className="w-4 h-4 text-sky-400" /> I-Track overview</span><span className="rounded-full bg-emerald-400/15 text-emerald-300 px-2 py-1">Live</span></div>
            <div className="grid grid-cols-2 gap-3 mb-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-white/50 text-xs">Account status</p><p className="text-white text-lg font-semibold mt-2">Active</p><div className="mt-3 h-1.5 rounded-full bg-emerald-400/30"><div className="h-full w-4/5 rounded-full bg-emerald-400" /></div></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-white/50 text-xs">Next due date</p><p className="text-white text-lg font-semibold mt-2">On track</p><p className="text-sky-300 text-xs mt-3">Billing made visible</p></div></div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white"><p className="text-white/70 text-xs">Payment history</p><div className="flex items-end gap-2 h-24 mt-3">{[38, 58, 46, 76, 64, 88, 72].map((height, index) => <div key={index} className="flex-1 rounded-t bg-white/70 animate-bar" style={{ height: `${height}%`, animationDelay: `${index * 80}ms` }} />)}</div></div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border px-6 py-4 flex items-center justify-between text-xs text-muted-foreground"><span>I-Track v1.0.0</span><button onClick={onAdminPanel} className="flex items-center gap-1.5 hover:text-foreground transition-colors" aria-label="Staff sign in"><Settings className="w-3.5 h-3.5" /><span>Staff sign in</span></button></footer>
    </div>
  );
}
