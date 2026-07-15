import { createClient } from "@supabase/supabase-js";
import { readClients, writeClients } from "./lib/storage.js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

function mapClient(item) {
  return {
    id: item.id,
    name: item.name,
    address: item.address ?? "",
    plan: Number(item.plan ?? 0),
    phone: item.phone ?? "",
    installDate: item.install_date ?? item.installDate ?? "",
    dueDate: item.due_date ?? item.dueDate ?? "",
    status: item.status ?? "active",
    password: item.password ?? "",
    payments: Array.isArray(item.payments) ? item.payments : [],
  };
}

export default async function handler(req, res) {
  if (supabase) {
    if (req.method === "GET") {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json((data ?? []).map(mapClient));
    }

    if (req.method === "PUT") {
      const body = Array.isArray(req.body) ? req.body : [];
      const payload = body.map((client) => ({
        id: client.id,
        name: client.name,
        address: client.address,
        plan: client.plan,
        phone: client.phone,
        install_date: client.installDate,
        due_date: client.dueDate,
        status: client.status,
        password: client.password,
        payments: client.payments,
      }));

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
    const body = req.body ?? [];
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
