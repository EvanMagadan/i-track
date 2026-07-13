import type { ClientStatus } from "../../types";

export function StatusBadge({ status }: { status: ClientStatus }) {
  const styles: Record<ClientStatus, string> = {
    active: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    disconnected: "bg-slate-100 text-slate-600",
    pending: "bg-amber-100 text-amber-700",
  };
  const dots: Record<ClientStatus, string> = {
    active: "bg-green-500",
    overdue: "bg-red-500",
    disconnected: "bg-slate-400",
    pending: "bg-amber-500",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
