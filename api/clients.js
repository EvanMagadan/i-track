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
