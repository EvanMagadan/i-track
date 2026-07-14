import { useEffect, useState } from "react";
import { Landing } from "./components/client/Landing";
import { ClientLogin } from "./components/client/ClientLogin";
import { ClientSignup } from "./components/client/ClientSignup";
import { ClientDashboard } from "./components/client/ClientDashboard";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminPanel } from "./components/admin/AdminPanel";
import { INITIAL_CLIENTS } from "./data";
import { supabase, supabaseAdmin } from "./lib/supabase";
import type { Client, View } from "./types";

async function readClientsFromStore(): Promise<Client[]> {
  if (!supabase) return INITIAL_CLIENTS;

  const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load clients from Supabase", error);
    return INITIAL_CLIENTS;
  }

  return (data ?? []).map((item) => ({
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
  }));
}

async function writeClientsToStore(clients: Client[]) {
  if (!supabase) return;

  for (const client of clients) {
    const { error } = await supabase.from("clients").upsert({
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
    });

    if (error) {
      console.error("Failed to save clients to Supabase", error);
      return;
    }
  }
}

async function deleteClientFromStore(clientId: string) {
  // Use admin client to bypass RLS policies
  const client = supabaseAdmin || supabase;
  
  if (!client) throw new Error("Supabase not configured");

  console.log(`🗑️ Deleting client ${clientId} from Supabase...`);

  const { error, data } = await client.from("clients").delete().eq("id", clientId).select();

  console.log("Delete response:", { error, data });

  if (error) {
    console.error("❌ Failed to delete client from Supabase", error);
    throw new Error(`Delete failed: ${error.message}`);
  }

  // Verify deletion by checking if record still exists
  const { data: checkData, error: checkError } = await client
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = not found (which is what we want)
    console.error("Error verifying deletion:", checkError);
  }

  if (checkData) {
    throw new Error("Client deletion failed: record still exists in database");
  }

  console.log(`✅ Client ${clientId} successfully deleted from Supabase`);
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
