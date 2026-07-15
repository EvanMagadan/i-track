import { useEffect, useState } from "react";
import { Landing } from "./components/client/Landing";
import { ClientLogin } from "./components/client/ClientLogin";
import { ClientSignup } from "./components/client/ClientSignup";
import { ClientDashboard } from "./components/client/ClientDashboard";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminPanel } from "./components/admin/AdminPanel";
import { INITIAL_CLIENTS } from "./data";
import { daysDiff } from "./utils";
import type { Client, View } from "./types";

async function readClientsFromStore(): Promise<Client[]> {
  try {
    const response = await fetch("/api/clients");
    if (!response.ok) throw new Error(`Failed to load clients: ${response.status}`);

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) return INITIAL_CLIENTS;

    return data.map((item) => {
      const client = item as Client;
      const normalized: Client = {
        id: client.id,
        name: client.name,
        address: client.address ?? "",
        plan: Number(client.plan ?? 0),
        phone: client.phone ?? "",
        installDate: client.installDate ?? "",
        dueDate: client.dueDate ?? "",
        status: (client.status as Client["status"]) ?? "active",
        password: client.password ?? "",
        payments: Array.isArray(client.payments) ? client.payments : [],
      };

      if (daysDiff(normalized.dueDate) > 0 && normalized.status === "active") {
        normalized.status = "overdue";
      }

      return normalized;
    });
  } catch (error) {
    console.error("Failed to load clients from API", error);
    return INITIAL_CLIENTS;
  }
}

async function writeClientsToStore(clients: Client[]) {
  try {
    const response = await fetch("/api/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clients),
    });

    if (!response.ok) {
      throw new Error(`Failed to save clients: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to save clients to API", error);
  }
}

async function deleteClientFromStore(clientId: string) {
  try {
    const response = await fetch(`/api/clients?id=${encodeURIComponent(clientId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to delete client via API", error);
    throw error instanceof Error ? error : new Error("Delete failed");
  }
}

export default function App() {
  const [view, setView] = useState<View>(() => {
    const savedAdmin = localStorage.getItem("adminLoggedIn");
    if (savedAdmin === "true") return "admin";
    const savedClientId = localStorage.getItem("loggedInClientId");
    return savedClientId ? "client-dashboard" : "landing";
  });
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [loggedInClientId, setLoggedInClientId] = useState<string | null>(() => {
    return localStorage.getItem("loggedInClientId");
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const handleClientLogout = () => {
    setLoggedInClientId(null);
    localStorage.removeItem("loggedInClientId");
    setView("landing");
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await readClientsFromStore();
        setClients(data);
      } catch (error) {
        console.error("Failed to load clients from store", error);
      } finally {
        setIsLoaded(true);
      }
    };

    void loadClients();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    void writeClientsToStore(clients);
  }, [clients, isLoaded]);

  const loggedInClient = loggedInClientId
    ? clients.find((c) => c.id === loggedInClientId) ?? null
    : null;

  const handleClientLogin = (c: Client) => {
    setLoggedInClientId(c.id);
    localStorage.setItem("loggedInClientId", c.id);
    setView("client-dashboard");
  };

  const handleClientActivation = (c: Client, newPassword: string) => {
    setClients((prev) => prev.map((cl) => (cl.id === c.id ? { ...cl, password: newPassword } : cl)));
    setLoggedInClientId(c.id);
    localStorage.setItem("loggedInClientId", c.id);
    setView("client-dashboard");
  };

  if (view === "landing") {
    return <Landing onClientPortal={() => setView("client-login")} onAdminPanel={() => setView("admin-login")} />;
  }

  if (view === "client-login") {
    return (
      <ClientLogin
        clients={clients}
        onLogin={handleClientLogin}
        onSignup={() => setView("client-signup")}
        onBack={() => setView("landing")}
      />
    );
  }

  if (view === "client-signup") {
    return <ClientSignup clients={clients} onActivated={handleClientActivation} onBack={() => setView("client-login")} />;
  }

  if (view === "client-dashboard" && !loggedInClient) {
    // Client was deleted or logged out, redirect to login
    return (
      <ClientLogin
        clients={clients}
        onLogin={handleClientLogin}
        onSignup={() => setView("client-signup")}
        onBack={() => setView("landing")}
      />
    );
  }

  if (view === "client-dashboard" && loggedInClient) {
    return <ClientDashboard client={loggedInClient} onLogout={handleClientLogout} />;
  }

  if (view === "admin-login") {
    return (
      <AdminLogin
        onLogin={() => {
          localStorage.setItem("adminLoggedIn", "true");
          setView("admin");
        }}
        onBack={() => setView("landing")}
      />
    );
  }

  if (view === "admin") {
    return (
      <AdminPanel
        clients={clients}
        setClients={setClients}
        deleteClient={deleteClientFromStore}
        onLogout={() => {
          localStorage.removeItem("adminLoggedIn");
          setView("landing");
        }}
      />
    );
  }

  return null;
}
