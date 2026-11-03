import { createClient } from "@supabase/supabase-js";
import { readClients, writeClients } from "./lib/storage.js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
// Never accept a VITE_* service key here. VITE variables are intended for values
// that may be exposed to the browser; a service-role key must remain server-only.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

function mapClient(item) {
  return {
    id: item.id,
    email: item.email ?? "",
    name: item.name,
    address: item.address ?? "",
    plan: Number(item.plan ?? 0),
    phone: item.phone ?? "",
    installDate: item.install_date ?? item.installDate ?? "",
    dueDate: item.due_date ?? item.dueDate ?? "",
    status: item.status ?? "active",
    payments: Array.isArray(item.payments) ? item.payments : [],
  };
}

async function requireAdmin(req) {
  const authorization = req.headers.authorization;
  if (!supabaseUrl || !supabaseAnonKey || !authorization?.startsWith("Bearer ")) return false;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) return false;
  const { data, error } = await authClient.rpc("is_app_admin");
  return !error && data === true;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!["GET", "PUT", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  if (!(await requireAdmin(req))) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  if (supabase) {
    if (req.method === "GET") {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json((data ?? []).map(mapClient));
    }

    if (req.method === "PUT") {
      if (!Array.isArray(req.body) || req.body.length > 500) {
        return res.status(400).json({ success: false, message: "Request must contain at most 500 clients" });
      }

      const body = req.body;
      const payload = body.map((client) => ({
        id: typeof client.id === "string" ? client.id : undefined,
        email: typeof client.email === "string" ? client.email.trim().toLowerCase() : undefined,
        name: typeof client.name === "string" ? client.name.trim() : undefined,
        address: typeof client.address === "string" ? client.address.trim() : "",
        plan: Number.isFinite(Number(client.plan)) ? Number(client.plan) : 0,
        phone: typeof client.phone === "string" ? client.phone.trim() : "",
        install_date: typeof client.installDate === "string" ? client.installDate : "",
        due_date: typeof client.dueDate === "string" ? client.dueDate : "",
        status: ["active", "overdue", "disconnected", "pending"].includes(client.status) ? client.status : "pending",
        payments: Array.isArray(client.payments) ? client.payments : [],
      }));

      if (payload.some((client) => !client.id || !client.email || !client.name || !client.due_date || !client.install_date)) {
        return res.status(400).json({ success: false, message: "Each client needs an id, email, name, install date, and due date" });
      }

      const { data, error } = await supabase.from("clients").upsert(payload).select();

      if (error) {
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json((data ?? []).map(mapClient));
    }

    if (req.method === "DELETE") {
      const clientId = req.query?.id;

      if (!clientId || typeof clientId !== "string") {
        return res.status(400).json({ success: false, message: "Client id is required" });
      }

      const { error } = await supabase.from("clients").delete().eq("id", clientId);

      if (error) {
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json({ success: true });
    }
  }

  if (req.method === "GET") {
    const clients = await readClients();
    return res.status(200).json(clients);
  }

  if (req.method === "PUT") {
    if (!Array.isArray(req.body) || req.body.length > 500) {
      return res.status(400).json({ success: false, message: "Request must contain at most 500 clients" });
    }
    const body = req.body;
    const clients = await writeClients(body);
    return res.status(200).json(clients);
  }

  if (req.method === "DELETE") {
    const clientId = req.query?.id;

    if (!clientId || typeof clientId !== "string") {
      return res.status(400).json({ success: false, message: "Client id is required" });
    }

    const clients = await readClients();
    const nextClients = clients.filter((client) => client.id !== clientId);

    if (nextClients.length === clients.length) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    await writeClients(nextClients);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
