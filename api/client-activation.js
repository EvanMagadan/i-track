import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const db = url && serviceKey ? createClient(url, serviceKey) : null;
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

async function isAdmin(req) {
  const authorization = req.headers.authorization;
  if (!url || !anonKey || !authorization?.startsWith("Bearer ")) return false;
  const client = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: user } = await client.auth.getUser();
  if (!user.user) return false;
  const { data } = await client.rpc("is_app_admin");
  return data === true;
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
    if (!(await isAdmin(req))) return res.status(401).json({ message: "Authentication required" });
    if (typeof clientId !== "string") return res.status(400).json({ message: "Client ID is required" });
    const requestedId = clientId.trim();
    const { data: client, error: clientError } = await db.from("clients").select("id").ilike("id", requestedId).single();
    if (clientError || !client) return res.status(404).json({ message: "Client not found" });
    const code = crypto.randomInt(100000, 999999).toString();
    const { error } = await db.from("client_activation_tokens").upsert({ client_id: client.id, token_hash: hash(code), expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), used_at: null });
    if (error) return res.status(400).json({ message: error.message });
    return res.status(200).json({ code, expiresInHours: 24 });
  }

  if (action === "consume") {
    if (typeof clientId !== "string" || typeof activationCode !== "string") return res.status(400).json({ message: "Client ID and activation code are required" });
    if (typeof password !== "string" || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    const id = clientId.trim();
    const { data, error } = await db.from("client_activation_tokens").select("client_id,token_hash,expires_at,used_at").ilike("client_id", id).single();
    if (error || !data || data.used_at || new Date(data.expires_at) <= new Date() || hash(activationCode.trim()) !== data.token_hash) return res.status(400).json({ message: "Invalid or expired activation code" });
    const { data: client } = await db.from("clients").select("id,auth_login").eq("id", data.client_id).single();
    const login = client?.auth_login ?? data.client_id.toLowerCase();
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email: `${login}@clients.i-track.local`,
      password,
      email_confirm: true,
      user_metadata: { client_id: data.client_id },
    });
    if (createError && !createError.message.toLowerCase().includes("already been registered")) return res.status(400).json({ message: createError.message });
    if (created.user) await db.from("client_activation_tokens").update({ used_at: new Date().toISOString() }).eq("client_id", data.client_id);
    return res.status(200).json({ login });
  }
  return res.status(400).json({ message: "Unknown action" });
}
