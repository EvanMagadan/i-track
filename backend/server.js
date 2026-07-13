import express from "express";
import cors from "cors";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = Number(process.env.PORT || 5000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.join(__dirname, "data", "clients.json");

const initialClients = [
  {
    id: "CLI-001",
    name: "Eduardo Reyes",
    address: "Brgy. Masagana, Atimonan, Quezon",
    plan: 500,
    phone: "09171234567",
    installDate: "2025-02-10",
    dueDate: "2026-07-10",
    status: "overdue",
    password: "reyes123",
    payments: [
      { id: "P001", month: "June 2026", date: "2026-06-10", amount: 500, method: "GCash" },
    ],
  },
  {
    id: "CLI-002",
    name: "Maria Santos",
    address: "Sitio Pulo, Brgy. Cawayan, Quezon",
    plan: 500,
    phone: "09189876543",
    installDate: "2025-03-15",
    dueDate: "2026-07-13",
    status: "active",
    password: "santos123",
    payments: [
      { id: "P002", month: "June 2026", date: "2026-06-12", amount: 500, method: "Cash" },
    ],
  },
];

let clients = [];

function sanitizeClient(client) {
  return {
    ...client,
    password: client.password ?? "",
    payments: Array.isArray(client.payments) ? client.payments : [],
  };
}

async function saveClients() {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(clients, null, 2));
}

async function loadClients() {
  try {
    const file = await fs.readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(file);
    clients = Array.isArray(parsed) ? parsed.map(sanitizeClient) : [];
  } catch {
    clients = initialClients;
    await saveClients();
  }
}

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "I-Track backend is running" });
});

app.get("/api/clients", (_req, res) => {
  res.json(clients);
});

app.post("/api/clients", async (req, res) => {
  const payload = req.body;
  if (!payload?.name) {
    return res.status(400).json({ success: false, message: "Client name is required" });
  }

  const newClient = {
    ...payload,
    id: payload.id || `CLI-${String(clients.length + 1).padStart(3, "0")}`,
    payments: payload.payments || [],
  };

  clients = [sanitizeClient(newClient), ...clients];
  await saveClients();
  res.status(201).json({ success: true, client: newClient });
});

app.put("/api/clients", async (req, res) => {
  clients = Array.isArray(req.body) ? req.body.map(sanitizeClient) : [];
  await saveClients();
  res.json(clients);
});

app.post("/api/clients/login", (req, res) => {
  const { name, password } = req.body;
  const match = clients.find(
    (client) => client.name.toLowerCase() === String(name).trim().toLowerCase() && client.password === password
  );

  if (match) {
    res.json({ success: true, client: match });
  } else {
    res.status(401).json({ success: false, message: "Invalid client credentials" });
  }
});

await loadClients();

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy. Trying ${nextPort}...`);
      server.close(() => startServer(nextPort));
    } else {
      console.error(error);
      process.exit(1);
    }
  });
};

startServer(PORT);
