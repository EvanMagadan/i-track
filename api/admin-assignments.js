import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const adminClient = url && serviceKey ? createClient(url, serviceKey) : null;

async function requireOwner(req) {
  const authorization = req.headers.authorization;
  if (!url || !anonKey || !adminClient || !authorization?.startsWith("Bearer ")) return null;
  const auth = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await auth.auth.getUser();
  if (userError || !userData.user) return null;
  const { data: isAdmin, error: adminError } = await auth.rpc("is_app_admin");
  if (adminError || isAdmin !== true) return null;
  const { data: role, error: roleError } = await auth.rpc("current_admin_role");
  if (roleError || role !== "owner") return null;
  return userData.user;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "PUT"].includes(req.method)) {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  if (!adminClient) return res.status(503).json({ success: false, message: "Assignment service is not configured." });
  const owner = await requireOwner(req);
  if (!owner) return res.status(403).json({ success: false, message: "Owner access required" });

  if (req.method === "GET") {
    const [{ data: admins, error: adminsError }, { data: profiles }, { data: assignments, error: assignmentsError }] = await Promise.all([
      adminClient.from("app_admins").select("user_id"),
      adminClient.from("admin_profiles").select("user_id, role, display_name"),
      adminClient.from("admin_client_assignments").select("admin_user_id, client_id"),
    ]);
    if (adminsError || assignmentsError) return res.status(500).json({ success: false, message: adminsError?.message ?? assignmentsError?.message });
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) return res.status(500).json({ success: false, message: usersError.message });
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    const adminIds = new Set((admins ?? []).map((admin) => admin.user_id));
    return res.status(200).json({
      role: "owner",
      admins: (users?.users ?? []).filter((user) => adminIds.has(user.id)).map((user) => {
        const profile = profileMap.get(user.id);
        return { userId: user.id, email: user.email ?? "", displayName: profile?.display_name ?? "", role: profile?.role ?? "owner" };
      }),
      assignments: assignments ?? [],
    });
  }

  const { adminUserId, clientId, assigned } = req.body ?? {};
  if (typeof adminUserId !== "string" || typeof clientId !== "string" || typeof assigned !== "boolean") {
    return res.status(400).json({ success: false, message: "adminUserId, clientId, and assigned are required" });
  }
  const { data: adminRow } = await adminClient.from("app_admins").select("user_id").eq("user_id", adminUserId).maybeSingle();
  const { data: clientRow } = await adminClient.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!adminRow || !clientRow) return res.status(404).json({ success: false, message: "Admin or client not found" });

  const result = assigned
    ? await adminClient.from("admin_client_assignments").upsert({ admin_user_id: adminUserId, client_id: clientId })
    : await adminClient.from("admin_client_assignments").delete().eq("admin_user_id", adminUserId).eq("client_id", clientId);
  if (result.error) return res.status(500).json({ success: false, message: result.error.message });
  return res.status(200).json({ success: true });
}
