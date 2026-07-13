import { useState } from "react";
import { AlertTriangle, CreditCard, Edit2, Plus, Trash2, X, History } from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { daysDiff, formatCurrency } from "../../utils";
import type { Client, ClientFormData, ClientStatus } from "../../types";

const EMPTY_FORM: ClientFormData = {
  name: "",
  address: "",
  plan: "500",
  phone: "",
  installDate: "",
  dueDate: "",
  status: "active",
  password: "",
};

export function AdminClients({
  clients,
  setClients,
  onOpenPayment,
}: {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  onOpenPayment: (c: Client) => void;
}) {
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setFormError("");
    setModal("add");
  };

  const openEdit = (c: Client) => {
    setForm({
      name: c.name,
      address: c.address,
      plan: String(c.plan),
      phone: c.phone,
      installDate: c.installDate,
      dueDate: c.dueDate,
      status: c.status,
      password: "",
    });
    setEditTarget(c);
    setFormError("");
    setModal("edit");
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.address.trim() || !form.dueDate || !form.installDate) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (modal === "add" && !form.password.trim()) {
      setFormError("Initial password is required.");
      return;
    }

    if (modal === "add") {
      const maxNum = clients.reduce((max, c) => {
        const n = parseInt(c.id.replace("CLI-", ""), 10);
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const newClient: Client = {
        id: `CLI-${String(maxNum + 1).padStart(3, "0")}`,
        name: form.name.trim(),
        address: form.address.trim(),
        plan: Number(form.plan),
        phone: form.phone.trim(),
        installDate: form.installDate,
        dueDate: form.dueDate,
        status: form.status,
        password: form.password,
        payments: [],
      };
      setClients((prev) => [...prev, newClient]);
    } else if (modal === "edit" && editTarget) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editTarget.id
            ? {
                ...c,
                name: form.name.trim(),
                address: form.address.trim(),
                plan: Number(form.plan),
                phone: form.phone.trim(),
                installDate: form.installDate,
                dueDate: form.dueDate,
                status: form.status,
                password: form.password.trim() || c.password,
              }
            : c
        )
      );
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
  };

  const f = (key: keyof ClientFormData, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Client Management</h1>
          <p className="text-muted-foreground text-sm">{clients.length} registered client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 active:opacity-80 transition"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, address, or ID…"
            className="w-full sm:w-80 px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                {['ID', 'Name', 'Address', 'Plan', 'Due Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className={`text-left text-xs text-muted-foreground font-medium px-4 py-3 ${h === 'Address' ? 'hidden lg:table-cell' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const days = daysDiff(c.dueDate);
                return (
                  <tr key={c.id} className="border-b border-border/40 last:border-0 hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell max-w-[160px] truncate">{c.address}</td>
                    <td className="px-4 py-3 font-mono font-semibold">{formatCurrency(c.plan)}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className={days > 0 ? "text-destructive font-semibold" : ""}>{c.dueDate}</span>
                      {days > 0 && <span className="ml-1.5 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded font-semibold">{days}d late</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => onOpenPayment(c)} className="p-1.5 rounded-md hover:bg-green-100 transition-colors text-muted-foreground hover:text-green-700" title="Record payment">
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Edit client">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setHistoryTarget(c)} className="p-1.5 rounded-md hover:bg-blue-100 transition-colors text-muted-foreground hover:text-blue-700" title="Show payment history">
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete client">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">{modal === "add" ? "Add New Client" : "Edit Client"}</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium block mb-1.5">Full Name <span className="text-destructive">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="Client full name" className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium block mb-1.5">Installation Address <span className="text-destructive">*</span></label>
                  <input type="text" value={form.address} onChange={(e) => f("address", e.target.value)} placeholder="Brgy., Municipality, Province" className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5">Contact Number</label>
                  <input type="text" value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="09XX-XXX-XXXX" className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5">Monthly Plan (₱) <span className="text-destructive">*</span></label>
                  <select value={form.plan} onChange={(e) => f("plan", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {[500, 1000, 1200, 1500, 2000].map((p) => <option key={p} value={p}>₱{p.toLocaleString()}/month</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5">Installation Date <span className="text-destructive">*</span></label>
                  <input type="date" value={form.installDate} onChange={(e) => f("installDate", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5">Next Due Date <span className="text-destructive">*</span></label>
                  <input type="date" value={form.dueDate} onChange={(e) => f("dueDate", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5">Account Status</label>
                  <select value={form.status} onChange={(e) => f("status", e.target.value as ClientStatus)} className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="active">Active</option>
                    <option value="overdue">Overdue</option>
                    <option value="disconnected">Disconnected</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5">{modal === "add" ? <>Login Password <span className="text-destructive">*</span></> : "New Password (blank = keep current)"}</label>
                  <input type="text" value={form.password} onChange={(e) => f("password", e.target.value)} placeholder={modal === "add" ? "Set client login password" : "Leave blank to keep"} className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              {formError && (
                <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {formError}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
                {modal === "add" ? "Add Client" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Payment History</h3>
                <p className="text-sm text-muted-foreground">{historyTarget.name} — {historyTarget.id}</p>
              </div>
              <button onClick={() => setHistoryTarget(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {historyTarget.payments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No payment history yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {historyTarget.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                    <div>
                      <p className="font-medium">{payment.month}</p>
                      <p className="text-xs text-muted-foreground">{payment.date} • {payment.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold mb-1">Delete Client?</h3>
            <p className="text-sm text-muted-foreground mb-5">This will permanently remove the client and all their billing records. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg font-semibold hover:opacity-90 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
