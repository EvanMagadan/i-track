import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, CreditCard } from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { daysDiff, formatCurrency } from "../../utils";
import type { Client } from "../../types";

export function AdminAlerts({
  overdue,
  cutoff,
  initialTab,
  onRecordPayment,
}: {
  overdue: Client[];
  cutoff: Client[];
  initialTab: "overdue" | "cutoff";
  onRecordPayment: (c: Client) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overdue" | "cutoff">(initialTab);
  const [sortBy, setSortBy] = useState<"daysAsc" | "daysDesc" | "dueDateAsc" | "dueDateDesc" | "monthAsc">("daysAsc");
  const list = activeTab === "overdue" ? overdue : cutoff;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const sortedList = useMemo(() => {
    const next = [...list];
    return next.sort((a, b) => {
      const aDays = daysDiff(a.dueDate);
      const bDays = daysDiff(b.dueDate);

      if (sortBy === "daysAsc") return aDays - bDays || a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name);
      if (sortBy === "daysDesc") return bDays - aDays || a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name);
      if (sortBy === "dueDateDesc") return b.dueDate.localeCompare(a.dueDate) || a.name.localeCompare(b.name);
      if (sortBy === "monthAsc") {
        const aMonth = a.dueDate.slice(0, 7);
        const bMonth = b.dueDate.slice(0, 7);
        return aMonth.localeCompare(bMonth) || a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name);
      }
      return a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name);
    });
  }, [list, sortBy]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Alert Center</h1>
        <p className="text-muted-foreground text-sm">Proactive billing notifications and overdue account tracking</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
        <button
          onClick={() => setActiveTab("overdue")}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border ${
            activeTab === "overdue" ? "bg-destructive text-destructive-foreground border-destructive" : "border-border hover:bg-accent"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Overdue
          <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${activeTab === "overdue" ? "bg-white/20" : "bg-red-100 text-red-700"}`}>
            {overdue.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("cutoff")}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border ${
            activeTab === "cutoff" ? "bg-amber-500 text-white border-amber-500" : "border-border hover:bg-accent"
          }`}
        >
          <Clock className="w-4 h-4" />
          Overdue 3+ Days
          <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${activeTab === "cutoff" ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}>
            {cutoff.length}
          </span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
        <p className="text-xs text-muted-foreground max-w-xl">Sort the current alert list by days overdue, due date, or month.</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full sm:w-auto px-3 py-2.5 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="daysAsc">Smallest days first</option>
            <option value="daysDesc">Largest days first</option>
            <option value="dueDateAsc">Due date, soonest first</option>
            <option value="dueDateDesc">Due date, latest first</option>
            <option value="monthAsc">Month</option>
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-card border border-border rounded-xl px-6 py-16 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-semibold">All clear</p>
          <p className="text-muted-foreground text-sm mt-1">No {activeTab === "overdue" ? "overdue accounts" : "accounts overdue by 3+ days"}.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {sortedList.map((c) => {
            const days = daysDiff(c.dueDate);
            return (
              <div key={c.id} className={`bg-card border rounded-xl px-4 sm:px-5 py-4 sm:py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-5 ${activeTab === "overdue" ? "border-red-200" : "border-amber-200"}`}>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{c.address}</p>
                  <p className="text-xs text-muted-foreground">Phone: <span className="font-mono">{c.phone || "—"}</span></p>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between xl:justify-end gap-3 sm:gap-4 shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="font-mono font-bold text-lg sm:text-xl leading-none">{formatCurrency(c.plan)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Due: <span className="font-mono">{c.dueDate}</span></p>
                  </div>
                  {activeTab === "overdue" ? (
                    <div className="bg-red-100 text-red-700 rounded-xl px-3 py-2.5 text-center min-w-[76px]">
                      <p className="text-2xl font-bold font-mono leading-none">{days}</p>
                      <p className="text-xs font-semibold mt-0.5">{days === 1 ? "Day" : "Days"} Past Due</p>
                    </div>
                  ) : (
                    <div className="bg-amber-100 text-amber-700 rounded-xl px-3 py-2.5 text-center min-w-[76px]">
                      <Clock className="w-5 h-5 mx-auto" />
                      <p className="text-xs font-semibold mt-1">3+ Days Overdue</p>
                    </div>
                  )}
                  <button onClick={() => onRecordPayment(c)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition shrink-0 w-full sm:w-auto" title="Record payment">
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
