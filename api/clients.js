import { readClients, writeClients } from "./lib/storage.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const clients = await readClients();
    return res.status(200).json(clients);
  }

  if (req.method === "PUT") {
    const body = req.body ?? [];
    const clients = await writeClients(body);
    return res.status(200).json(clients);
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
