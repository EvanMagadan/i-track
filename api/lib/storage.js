import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "..", "data");
const dataFilePath = path.join(dataDir, "clients.json");

const initialClients = [];

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
