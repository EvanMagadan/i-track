import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const db = url && serviceKey ? createClient(url, serviceKey) : null;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed" });
  }
  const authorization = req.headers.authorization;
  if (!db || !url || !anonKey || !authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) return res.status(401).json({ message: "Authentication required" });

  const { data: client, error } = await db
    .from("clients")
    .select("id,email,name,address,plan,phone,install_date,due_date,status,payments")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();
  if (error) return res.status(500).json({ message: "Could not load client profile" });
  if (!client) return res.status(404).json({ message: "Client profile not found" });
  return res.status(200).json({ client });
}
