import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "..", "data");
const dataFilePath = path.join(dataDir, "clients.json");

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
    payments: [{ id: "P001", month: "June 2026", date: "2026-06-10", amount: 500, method: "GCash" }],
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
    payments: [{ id: "P002", month: "June 2026", date: "2026-06-12", amount: 500, method: "Cash" }],
  },
];

function sanitizeClient(client) {
  return {
    ...client,
    password: client.password ?? "",
    payments: Array.isArray(client.payments) ? client.payments : [],
  };
}

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, JSON.stringify(initialClients, null, 2));
  }
}

export async function readClients() {
  await ensureStorage();
  const file = await fs.readFile(dataFilePath, "utf8");
  const parsed = JSON.parse(file);
  return Array.isArray(parsed) ? parsed.map(sanitizeClient) : initialClients;
}

export async function writeClients(clients) {
  await ensureStorage();
  const sanitized = Array.isArray(clients) ? clients.map(sanitizeClient) : [];
  await fs.writeFile(dataFilePath, JSON.stringify(sanitized, null, 2));
  return sanitized;
}
