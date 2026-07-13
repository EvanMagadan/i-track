import { useState } from "react";
import { CreditCard, X } from "lucide-react";
import { advanceDueDate, monthLabel, toLocalDateStr } from "../../utils";
import { TODAY } from "../../data";
import type { Client, Payment } from "../../types";

export function RecordPaymentModal({
  client,
  onClose,
  onSave,
}: {
  client: Client;
  onClose: () => void;
  onSave: (clientId: string, payment: Payment) => void;
}) {
  const todayStr = toLocalDateStr(TODAY);
  const [amount, setAmount] = useState(String(client.plan));
  const [method, setMethod] = useState("Cash");
  const [date, setDate] = useState(todayStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPayment: Payment = {
      id: `P${Date.now()}`,
      month: monthLabel(client.dueDate),
      date,
      amount: Number(amount),
      method,
    };
    onSave(client.id, newPayment);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold">Record Payment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{client.name} — {client.id}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
              <p className="font-semibold text-blue-800">Recording payment for:</p>
              <p className="text-blue-700 mt-0.5">
                <span className="font-mono font-bold">{monthLabel(client.dueDate)}</span>{" "}(due <span className="font-mono">{client.dueDate}</span>)
              </p>
              <p className="text-xs text-blue-600 mt-1">
                After saving, due date will advance to <span className="font-mono font-semibold">{advanceDueDate(client.dueDate)}</span>{" "}
                and account status will be set to <span className="font-semibold">Active</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1.5">
                  Amount (₱) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5">
                  Payment Method <span className="text-destructive">*</span>
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Palawan Express'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-1.5">
                  Date Paid <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={todayStr}
                  className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              <CreditCard className="w-4 h-4" />
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
