import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { TODAY } from "../../data";
import { formatCurrency } from "../../utils";
import type { Client } from "../../types";

export function AdminCalendar({ clients }: { clients: Client[] }) {
  const [viewDate, setViewDate] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleDateString("en-PH", { month: "long", year: "numeric" });

  const dueMap = useMemo(() => {
    const map: Record<number, Client[]> = {};
    clients.forEach((c) => {
      const d = new Date(c.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(c);
      }
    });
    return map;
  }, [clients, year, month]);

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayDay = TODAY.getDate();
  const isCurrentMonth = TODAY.getFullYear() === year && TODAY.getMonth() === month;
  const selectedClients = selectedDay ? dueMap[selectedDay] || [] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Billing Calendar</h1>
          <p className="text-muted-foreground text-sm">Client due dates mapped by day</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setViewDate(new Date(year, month - 1, 1));
              setSelectedDay(null);
            }}
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold min-w-[148px] text-center">{monthName}</span>
          <button
            onClick={() => {
              setViewDate(new Date(year, month + 1, 1));
              setSelectedDay(null);
            }}
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const due = day ? dueMap[day] || [] : [];
            const isToday = isCurrentMonth && day === todayDay;
            const isSelected = day === selectedDay;

            return (
              <div
                key={i}
                onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                className={`min-h-[72px] sm:min-h-[84px] border-b border-r border-border/50 p-1.5 transition-colors ${
                  !day ? "bg-muted/20" : isSelected ? "bg-primary/10 cursor-pointer" : isToday ? "bg-primary/5 cursor-pointer" : "hover:bg-accent/50 cursor-pointer"
                }`}
              >
                {day && (
                  <>
                    <span className={`text-xs font-mono inline-flex items-center justify-center w-5 h-5 rounded-full ${isToday ? "bg-primary text-primary-foreground font-bold" : isSelected ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground"}`}>
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {due.slice(0, 2).map((c) => (
                        <div key={c.id} className={`text-xs px-1 py-0.5 rounded truncate font-medium ${c.status === "overdue" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`} title={`${c.name} — ${formatCurrency(c.plan)}`}>
                          {c.name.split(" ")[0]}
                        </div>
                      ))}
                      {due.length > 2 && <div className="text-xs text-muted-foreground px-1">+{due.length - 2} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        {[
          { color: "bg-blue-100 border-blue-200", label: "Active — due" },
          { color: "bg-red-100 border-red-200", label: "Overdue" },
          { color: "bg-primary/10 border-primary/20", label: "Today" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-3 h-3 rounded border ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>

      {selectedDay && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">
            {selectedDay} {viewDate.toLocaleDateString("en-PH", { month: "long", year: "numeric" })} — {selectedClients.length === 0 ? "No payments due" : `${selectedClients.length} payment${selectedClients.length !== 1 ? "s" : ""} due`}
          </h3>
          {selectedClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clients have a due date on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedClients.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-sm">{formatCurrency(c.plan)}</span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
