import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const db = url && serviceKey ? createClient(url, serviceKey) : null;
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

async function getAdminContext(req) {
  const authorization = req.headers.authorization;
  if (!url || !anonKey || !authorization?.startsWith("Bearer ")) return null;
  const client = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: user } = await client.auth.getUser();
  if (!user.user) return null;
  const { data: organizationId } = await client.rpc("current_organization_id");
  const { data: role } = await client.rpc("current_organization_role");
  if (organizationId && ["owner", "admin"].includes(role)) return { organizationId };
  const { data: legacyAdmin } = await client.rpc("is_app_admin");
  return legacyAdmin === true ? { organizationId: null } : null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }
  if (!db) return res.status(500).json({ message: "Activation service is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the dev deployment." });
  const { action, clientId, activationCode, password } = req.body ?? {};

  if (action === "issue") {
    const admin = await getAdminContext(req);
    if (!admin) return res.status(401).json({ message: "Authentication required" });
    if (typeof clientId !== "string") return res.status(400).json({ message: "Client ID is required" });
    const requestedId = clientId.trim();
    let clientQuery = db.from("clients").select("id").ilike("id", requestedId);
    if (admin.organizationId) clientQuery = clientQuery.eq("organization_id", admin.organizationId);
    const { data: client, error: clientError } = await clientQuery.single();
    if (clientError || !client) return res.status(404).json({ message: "Client not found" });
    const code = crypto.randomInt(100000, 999999).toString();
    const { error } = await db.from("client_activation_tokens").upsert({ client_id: client.id, token_hash: hash(code), expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), used_at: null });
    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json({ code, expiresInHours: 24 });
  }

  if (action === "consume" || action === "reset") {
    if (typeof clientId !== "string" || typeof activationCode !== "string") return res.status(400).json({ message: "Client ID and activation code are required" });
    if (typeof password !== "string" || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    const id = clientId.trim();
    const forwardedFor = req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown";
    const rateKey = hash(`${id.toLowerCase()}:${String(forwardedFor).split(",")[0]}`);
    const { data: allowed, error: rateError } = await db.rpc("check_activation_rate_limit", { rate_key: rateKey });
    if (rateError || allowed !== true) return res.status(429).json({ message: "Too many activation attempts. Please wait 15 minutes and try again." });
    const { data, error } = await db.from("client_activation_tokens").select("client_id,token_hash,expires_at,used_at").ilike("client_id", id).single();
    if (error || !data || data.used_at || new Date(data.expires_at) <= new Date() || hash(activationCode.trim()) !== data.token_hash) return res.status(400).json({ message: "Invalid or expired activation code" });
    const { data: client } = await db.from("clients").select("id,auth_login").eq("id", data.client_id).single();
    const login = client?.auth_login ?? data.client_id.toLowerCase();
    if (action === "reset") {
      const { data: linkedClient } = await db.from("clients").select("auth_user_id").eq("id", data.client_id).single();
      if (!linkedClient?.auth_user_id) return res.status(409).json({ message: "This client account has not been activated yet." });
      const { error: resetError } = await db.auth.admin.updateUserById(linkedClient.auth_user_id, { password });
      if (resetError) return res.status(400).json({ message: resetError.message });
      await db.from("client_activation_tokens").update({ used_at: new Date().toISOString() }).eq("client_id", data.client_id);
      return res.status(200).json({ login });
    }
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email: `${login}@clients.i-track.local`,
      password,
      email_confirm: true,
      user_metadata: { client_id: data.client_id },
    });
    if (createError && !createError.message.toLowerCase().includes("already been registered")) return res.status(400).json({ message: createError.message });
    const authUserId = created.user?.id;
    if (!authUserId) {
      const { data: existing } = await db.from("clients").select("auth_user_id").eq("id", data.client_id).single();
      if (!existing?.auth_user_id) return res.status(409).json({ message: "This account already exists but is not linked yet. Please contact your provider." });
    } else {
      const { error: linkError } = await db.from("clients").update({ auth_user_id: authUserId }).eq("id", data.client_id).is("auth_user_id", null);
      if (linkError) return res.status(500).json({ message: "Account created, but your client profile could not be linked. Please try again." });
    }
    await db.from("client_activation_tokens").update({ used_at: new Date().toISOString() }).eq("client_id", data.client_id);
    return res.status(200).json({ login });
  }
  return res.status(400).json({ message: "Unknown action" });
}
