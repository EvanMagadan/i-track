import { Activity, AlertTriangle, LogOut, User } from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { TopBar } from "../shared/TopBar";
import { daysDiff, formatCurrency, formatDate } from "../../utils";
import type { Client } from "../../types";

export function ClientDashboard({ client, onLogout }: { client: Client; onLogout: () => void }) {
  const overdueDays = daysDiff(client.dueDate);
  const isOverdue = overdueDays > 0;
  const isDueToday = overdueDays === 0;
  const isDueTomorrow = overdueDays === -1;
  const showWarning = isOverdue || isDueToday || isDueTomorrow;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar
        title="I-Track"
        rightSlot={
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{client.name}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold">Welcome back, {client.name.split(" ")[0]}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Account ID: <span className="font-mono text-foreground">{client.id}</span>
            </p>
          </div>

          {showWarning && (
            <div
              className={`rounded-xl px-4 py-3.5 flex items-start gap-3 mb-6 border ${
                isOverdue ? "bg-red-50 border-red-200" : isDueToday ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  isOverdue ? "text-red-600" : isDueToday ? "text-amber-600" : "text-blue-600"
                }`}
              />
              <div>
                <p className={`text-sm font-semibold ${isOverdue ? "text-red-800" : isDueToday ? "text-amber-800" : "text-blue-800"}`}>
                  {isOverdue
                    ? `Account Overdue — ${overdueDays} Day${overdueDays !== 1 ? "s" : ""} Past Due`
                    : isDueToday
                    ? "Payment Due Today"
                    : "Payment Due Tomorrow"}
                </p>
                <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-700" : isDueToday ? "text-amber-700" : "text-blue-700"}`}>
                  {isOverdue
                    ? `Your payment was due on ${formatDate(client.dueDate)}. Please settle to avoid service interruption.`
                    : isDueToday
                    ? `Your monthly payment of ${formatCurrency(client.plan)} is due today.`
                    : `Your payment of ${formatCurrency(client.plan)} is due on ${formatDate(client.dueDate)}.`}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Monthly Plan</p>
              <p className="text-2xl font-bold font-mono leading-none">{formatCurrency(client.plan)}</p>
              <p className="text-xs text-muted-foreground mt-1">per month</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Status</p>
              <StatusBadge status={client.status} />
              {isOverdue && <p className="text-xs text-destructive font-mono font-semibold mt-1.5">{overdueDays}d past due</p>}
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Next Due Date</p>
              <p className="text-sm font-semibold font-mono leading-snug">{client.dueDate}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isOverdue ? "Overdue" : isDueToday ? "Due today" : isDueTomorrow ? "Due tomorrow" : formatDate(client.dueDate).split(" ").slice(0, 2).join(" ")}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Client Since</p>
              <p className="text-sm font-semibold font-mono leading-snug">{client.installDate}</p>
              <p className="text-xs text-muted-foreground mt-1">Installation date</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Account Details
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Full Name</p>
                  <p className="font-medium">{client.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Installation Address</p>
                  <p className="font-medium leading-snug">{client.address}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Contact Number</p>
                  <p className="font-mono font-medium">{client.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Account ID</p>
                  <p className="font-mono font-medium">{client.id}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                Payment History
              </h2>
              {client.payments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No payment records yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Month', 'Date Paid', 'Amount', 'Method'].map((h) => (
                          <th key={h} className="text-left text-xs text-muted-foreground font-medium pb-2.5 px-1">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {client.payments.map((p) => (
                        <tr key={p.id} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 px-1 font-medium">{p.month}</td>
                          <td className="py-2.5 px-1 font-mono text-xs text-muted-foreground">{p.date}</td>
                          <td className="py-2.5 px-1 font-mono font-semibold">{formatCurrency(p.amount)}</td>
                          <td className="py-2.5 px-1">
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{p.method}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
