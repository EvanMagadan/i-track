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
  if (!supabaseUrl || !supabaseAnonKey || !authorization?.startsWith("Bearer ")) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) return null;
  const { data, error } = await authClient.rpc("is_app_admin");
  const orgResult = await authClient.rpc("current_organization_id");
  const roleResult = await authClient.rpc("current_organization_role");
  if (!orgResult.error && orgResult.data) return { userId: userData.user.id, organizationId: orgResult.data, role: roleResult.error ? "owner" : roleResult.data ?? "owner" };
  if (error || data !== true) return null;
  const legacyRoleResult = await authClient.rpc("current_admin_role");
  return { userId: userData.user.id, role: legacyRoleResult.error ? "owner" : legacyRoleResult.data ?? "owner" };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!["GET", "PUT", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  if (supabase) {
    if (req.method === "GET") {
      let query = supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (admin.organizationId) query = query.eq("organization_id", admin.organizationId);
      else if (admin.role !== "owner") {
        const { data: assignments, error: assignmentError } = await supabase.from("admin_client_assignments").select("client_id").eq("admin_user_id", admin.userId);
        if (assignmentError) return res.status(500).json({ success: false, message: assignmentError.message });
        const assignedIds = (assignments ?? []).map((assignment) => assignment.client_id);
        if (assignedIds.length === 0) return res.status(200).json([]);
        query = query.in("id", assignedIds);
      }
      const { data, error } = await query;

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
        auth_login: typeof client.id === "string" ? client.id.trim().toLowerCase() : undefined,
        name: typeof client.name === "string" ? client.name.trim() : undefined,
        address: typeof client.address === "string" ? client.address.trim() : "",
        plan: Number.isFinite(Number(client.plan)) ? Number(client.plan) : 0,
        phone: typeof client.phone === "string" ? client.phone.trim() : "",
        install_date: typeof client.installDate === "string" ? client.installDate : "",
        due_date: typeof client.dueDate === "string" ? client.dueDate : "",
        status: ["active", "overdue", "disconnected", "pending"].includes(client.status) ? client.status : "pending",
        payments: Array.isArray(client.payments) ? client.payments : [],
        organization_id: admin.organizationId,
      }));

      if (payload.some((client) => !client.id || !client.name || !client.due_date || !client.install_date)) {
        return res.status(400).json({ success: false, message: "Each client needs an id, name, install date, and due date" });
      }

      if (!admin.organizationId && admin.role !== "owner") {
        const { data: assignments } = await supabase.from("admin_client_assignments").select("client_id").eq("admin_user_id", admin.userId).in("client_id", payload.map((client) => client.id));
        const allowed = new Set((assignments ?? []).map((assignment) => assignment.client_id));
        if (payload.some((client) => !allowed.has(client.id))) return res.status(403).json({ success: false, message: "You can only update clients assigned to you." });
      }

      if (admin.organizationId) {
        const { data: existingClients, error: existingError } = await supabase
          .from("clients")
          .select("id,organization_id")
          .in("id", payload.map((client) => client.id));
        if (existingError) return res.status(500).json({ success: false, message: existingError.message });
        const belongsToAnotherOrganization = (existingClients ?? []).some((client) => client.organization_id && client.organization_id !== admin.organizationId);
        if (belongsToAnotherOrganization) return res.status(409).json({ success: false, message: "A client ID already belongs to another provider. Please use a different ID." });
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

      if (admin.organizationId) {
        const { data: ownedClient } = await supabase.from("clients").select("id").eq("id", clientId).eq("organization_id", admin.organizationId).maybeSingle();
        if (!ownedClient) return res.status(403).json({ success: false, message: "You can only delete clients in your organization." });
      } else if (admin.role !== "owner") {
        const { data: assignment } = await supabase.from("admin_client_assignments").select("client_id").eq("admin_user_id", admin.userId).eq("client_id", clientId).maybeSingle();
        if (!assignment) return res.status(403).json({ success: false, message: "You can only delete clients assigned to you." });
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
