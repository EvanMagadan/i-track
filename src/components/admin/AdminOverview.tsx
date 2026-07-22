import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, DollarSign, Users, Eye, EyeOff } from "lucide-react";
import { TODAY } from "../../data";
import { daysDiff, formatCurrency } from "../../utils";
import type { Client, AdminTab } from "../../types";

export function AdminOverview({
  clients,
  overdue,
  cutoff,
  setTab,
}: {
  clients: Client[];
  overdue: Client[];
  cutoff: Client[];
  setTab: (t: AdminTab, alertTab?: "overdue" | "cutoff") => void;
}) {
  const [showRevenue, setShowRevenue] = useState(false);

  const active = clients.filter((c) => c.status === "active");
  const monthlyRevenue = active.reduce((sum, c) => sum + c.plan, 0);
  const sortByRecentOverdue = (a: Client, b: Client) =>
    daysDiff(a.dueDate) - daysDiff(b.dueDate) ||
    a.dueDate.localeCompare(b.dueDate) ||
    a.name.localeCompare(b.name);
  const recentCutoff = [...cutoff].sort(sortByRecentOverdue).slice(0, 3);
  const recentOverdue = [...overdue].sort(sortByRecentOverdue).slice(0, 3);

  const standardStats = [
    { label: "Total Clients", value: clients.length, icon: <Users className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active", value: active.length, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50" },
    { label: "Overdue", value: overdue.length, icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm">
          {TODAY.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {standardStats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-xl sm:text-2xl font-bold font-mono leading-none break-words">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}

        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              
              <button
                type="button"
                onClick={() => setShowRevenue((prev) => !prev)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                title={showRevenue ? "Hide Revenue" : "Show Revenue"}
              >
                {showRevenue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xl sm:text-2xl font-bold font-mono leading-none break-words">
              {showRevenue ? (
                formatCurrency(monthlyRevenue)
              ) : (
                <span className="select-none tracking-widest text-muted-foreground">
                  ₱••••••
                </span>
              )}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Monthly Revenue</p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4 mb-6">
        {cutoff.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-amber-800 text-sm">Overdue 3+ Days ({cutoff.length})</h3>
              </div>
              <button onClick={() => setTab("alerts", "cutoff")} className="text-xs text-amber-700 hover:underline font-medium">
                View alerts
              </button>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {recentCutoff.map((c) => {
                const days = daysDiff(c.dueDate);
                return (
                  <button
                    key={c.id}
                    onClick={() => setTab("alerts", "cutoff")}
                    className="w-full flex items-center justify-between gap-3 text-sm rounded-lg px-3 py-2 text-left hover:bg-amber-100/70 transition-colors"
                  >
                    <span className="min-w-0 flex-1 font-medium text-amber-900 truncate">{c.name}</span>
                    <span className="font-mono text-amber-700 font-semibold shrink-0 whitespace-nowrap">{formatCurrency(c.plan)} · {days}d late</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {overdue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="font-semibold text-red-800 text-sm">Overdue Accounts ({overdue.length})</h3>
              </div>
              <button onClick={() => setTab("alerts", "overdue")} className="text-xs text-red-600 hover:underline font-medium">
                View all
              </button>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {recentOverdue.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setTab("alerts", "overdue")}
                  className="w-full flex items-center justify-between gap-3 text-sm rounded-lg px-3 py-2 text-left hover:bg-red-100/70 transition-colors"
                >
                  <span className="min-w-0 flex-1 font-medium text-red-900 truncate">{c.name}</span>
                  <span className="font-mono text-red-700 font-semibold bg-red-100 px-2 py-0.5 rounded shrink-0 whitespace-nowrap">{daysDiff(c.dueDate)}d past due</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}