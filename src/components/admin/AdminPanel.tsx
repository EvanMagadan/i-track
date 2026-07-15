import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Bell, Calendar, LogOut, Menu, Users, Wifi } from "lucide-react";
import { AdminOverview } from "./AdminOverview";
import { AdminClients } from "./AdminClients";
import { AdminCalendar } from "./AdminCalendar";
import { AdminAlerts } from "./AdminAlerts";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { advanceDueDate, daysDiff } from "../../utils";
import type { AdminTab, Client, Payment } from "../../types";

export function AdminPanel({
  clients,
  setClients,
  deleteClient,
  onLogout,
}: {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  deleteClient: (clientId: string) => Promise<void>;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Client | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  const handleRecordPayment = (clientId: string, payment: Payment) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, payments: [payment, ...c.payments], dueDate: advanceDueDate(c.dueDate), status: "active" }
          : c
      )
    );
  };

  const overdue = useMemo(() => clients.filter((c) => daysDiff(c.dueDate) > 0), [clients]);
  const cutoff = useMemo(() => clients.filter((c) => daysDiff(c.dueDate) >= 3), [clients]);
  const alertCount = overdue.length + cutoff.length;

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
    { id: "clients", label: "Clients", icon: <Users className="w-4 h-4" />, badge: clients.length },
    { id: "calendar", label: "Billing Calendar", icon: <Calendar className="w-4 h-4" /> },
    { id: "alerts", label: "Alerts", icon: <Bell className="w-4 h-4" />, badge: alertCount || undefined },
  ];

  const handleTabChange = (id: AdminTab) => {
    setTab(id);
    setSidebarOpen(false);
  };

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border bg-card px-4 sm:px-6 py-3.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-accent transition-colors lg:hidden">
            <Menu className="w-4 h-4" />
          </button>
          <Wifi className="w-5 h-5 text-primary" />
          <span className="font-bold tracking-tight text-sm">I-Track</span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full hidden sm:block">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          {alertCount > 0 && (
            <button onClick={() => handleTabChange("alerts")} className="relative p-1.5 rounded-md hover:bg-accent transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-mono font-bold">
                {alertCount}
              </span>
            </button>
          )}
          <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside
          className={`fixed lg:static top-0 left-0 h-full z-30 lg:z-auto w-56 bg-card border-r border-border shrink-0 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          style={{ top: sidebarOpen ? "53px" : undefined }}
        >
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === item.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}
              >
                <div className="flex items-center gap-2.5">{item.icon}{item.label}</div>
                {item.badge !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${tab === item.id ? "bg-white/20 text-white" : item.id === "alerts" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
          {tab === "overview" && <AdminOverview clients={clients} overdue={overdue} cutoff={cutoff} setTab={setTab} />}
          {tab === "clients" && <AdminClients clients={clients} setClients={setClients} deleteClient={deleteClient} onOpenPayment={setPaymentTarget} />}
          {tab === "calendar" && <AdminCalendar clients={clients} />}
          {tab === "alerts" && <AdminAlerts overdue={overdue} cutoff={cutoff} onRecordPayment={setPaymentTarget} />}
        </main>
      </div>

      {paymentTarget && (
        <RecordPaymentModal
          client={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSave={(id, payment) => {
            handleRecordPayment(id, payment);
            setPaymentTarget(null);
          }}
        />
      )}
    </div>
  );
}
