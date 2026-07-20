import { useEffect, useState, useCallback } from "react";
import { Landing } from "./components/client/Landing";
import { ClientLogin } from "./components/client/ClientLogin";
import { ClientSignup } from "./components/client/ClientSignup";
import { ClientDashboard } from "./components/client/ClientDashboard";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminPanel } from "./components/admin/AdminPanel";
import { INITIAL_CLIENTS } from "./data";
import { supabase } from "./lib/supabase";
import { daysDiff } from "./utils";
import type { Client, View } from "./types";

function formatClientItem(item: any): Client {
  const normalized: Client = {
    id: item.id,
    name: item.name,
    address: item.address ?? "",
    plan: Number(item.plan ?? 0),
    phone: item.phone ?? "",
    installDate: item.install_date ?? "",
    dueDate: item.due_date ?? "",
    status: (item.status as Client["status"]) ?? "active",
    password: item.password ?? "",
    payments: Array.isArray(item.payments) ? item.payments : [],
  };

  if (daysDiff(normalized.dueDate) > 0 && normalized.status === "active") {
    normalized.status = "overdue";
  }

  return normalized;
}

async function readClientsFromStore(): Promise<Client[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured in the environment");
  }

  try {
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map(formatClientItem);
  } catch (error) {
    console.error("Failed to load clients from Supabase", error);
    return INITIAL_CLIENTS;
  }
}

async function writeSingleClientToStore(client: Client) {
  if (!supabase) return;

  try {
    const payload = {
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
    };

    const { error } = await supabase.from("clients").upsert(payload);
    if (error) throw error;
  } catch (error) {
    console.error("Failed to save client to Supabase", error);
  }
}

async function deleteClientFromStore(clientId: string) {
  try {
    const response = await fetch(`/api/clients?id=${encodeURIComponent(clientId)}`, { method: "DELETE" });

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

  const loadClients = useCallback(async () => {
    try {
      const data = await readClientsFromStore();
      setClients(data);
    } catch (error) {
      console.error("Failed to load clients from store", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadClients();

    if (!supabase) return;

    const clientChannel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        (payload) => {
          console.log("Realtime change detected:", payload);
          void loadClients();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(clientChannel);
    };
  }, [loadClients]);

  const loggedInClient = loggedInClientId
    ? clients.find((c) => c.id === loggedInClientId) ?? null
    : null;

  const handleClientLogin = (c: Client) => {
    setLoggedInClientId(c.id);
    localStorage.setItem("loggedInClientId", c.id);
    setView("client-dashboard");
  };

  const handleClientActivation = async (c: Client, newPassword: string) => {
    const updatedClient = { ...c, password: newPassword };
    
    setClients((prev) => prev.map((cl) => (cl.id === c.id ? updatedClient : cl)));
    await writeSingleClientToStore(updatedClient);

    setLoggedInClientId(c.id);
    localStorage.setItem("loggedInClientId", c.id);
    setView("client-dashboard");
  };

  const handleSetClients = useCallback((updateOrNextState: React.SetStateAction<Client[]>) => {
    setClients((prev) => {
      const nextState = typeof updateOrNextState === "function" ? updateOrNextState(prev) : updateOrNextState;
      
      nextState.forEach((client) => {
        const matchingOld = prev.find((p) => p.id === client.id);
        if (!matchingOld || JSON.stringify(matchingOld) !== JSON.stringify(client)) {
          void writeSingleClientToStore(client);
        }
      });
      return nextState;
    });
  }, []);

  if (!isLoaded) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", color: "#666" }}>
        Loading project data...
      </div>
    );
  }

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
        setClients={handleSetClients}
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