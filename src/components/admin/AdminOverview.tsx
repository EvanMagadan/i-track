import { AlertTriangle, CheckCircle, Clock, DollarSign, Users } from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
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
  setTab: (t: AdminTab) => void;
}) {
  const active = clients.filter((c) => c.status === "active");
  const monthlyRevenue = active.reduce((sum, c) => sum + c.plan, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm">
          {TODAY.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Clients", value: clients.length, icon: <Users className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active", value: active.length, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50" },
          { label: "Overdue", value: overdue.length, icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-600", bg: "bg-red-50" },
          { label: "Monthly Revenue", value: formatCurrency(monthlyRevenue), icon: <DollarSign className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold font-mono leading-none">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-6">
        {cutoff.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-amber-800 text-sm">Overdue 3+ Days ({cutoff.length})</h3>
            </div>
            <div className="space-y-2">
              {cutoff.map((c) => {
                const days = daysDiff(c.dueDate);
                return (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-amber-900">{c.name}</span>
                  <span className="font-mono text-amber-700 font-semibold">{formatCurrency(c.plan)} · {days}d late</span>
                </div>
              );})}
            </div>
          </div>
        )}
        {overdue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="font-semibold text-red-800 text-sm">Overdue Accounts ({overdue.length})</h3>
              </div>
              <button onClick={() => setTab("alerts")} className="text-xs text-red-600 hover:underline font-medium">
                View all
              </button>
            </div>
            <div className="space-y-2">
              {overdue.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-red-900">{c.name}</span>
                  <span className="font-mono text-red-700 font-semibold bg-red-100 px-2 py-0.5 rounded">{daysDiff(c.dueDate)}d past due</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="font-semibold text-sm">All Clients</h2>
          <button onClick={() => setTab("clients")} className="text-xs text-primary hover:underline font-medium">
            Manage →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                {['Name', 'Address', 'Plan', 'Due Date', 'Status'].map((h) => (
                  <th key={h} className={`text-left text-xs text-muted-foreground font-medium px-4 py-2.5 ${h === 'Address' ? 'hidden md:table-cell' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const days = daysDiff(c.dueDate);
                return (
                  <tr key={c.id} className="border-b border-border/40 last:border-0 hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-[180px] truncate">{c.address}</td>
                    <td className="px-4 py-3 font-mono font-semibold">{formatCurrency(c.plan)}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className={days > 0 ? "text-destructive font-semibold" : ""}>{c.dueDate}</span>
                      {days > 0 && <span className="ml-2 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-semibold">+{days}d</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
