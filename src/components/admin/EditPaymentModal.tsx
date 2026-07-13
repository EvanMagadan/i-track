import { useState } from "react";
import { Edit2, X } from "lucide-react";
import type { Payment } from "../../types";

export function EditPaymentModal({
  payment,
  onClose,
  onSave,
}: {
  payment: Payment;
  onClose: () => void;
  onSave: (updatedPayment: Payment) => void;
}) {
  const [amount, setAmount] = useState(String(payment.amount));
  const [date, setDate] = useState(payment.date);
  const [method, setMethod] = useState(payment.method);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...payment,
      amount: Number(amount),
      date,
      method,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold">Edit Payment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{payment.month}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
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
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              <Edit2 className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
