import { useEffect, useState } from "react";
import { Landing } from "./components/client/Landing";
import { ClientLogin } from "./components/client/ClientLogin";
import { ClientSignup } from "./components/client/ClientSignup";
import { ClientDashboard } from "./components/client/ClientDashboard";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminPanel } from "./components/admin/AdminPanel";
import { INITIAL_CLIENTS } from "./data";
import { supabase } from "./lib/supabase";
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

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [loggedInClientId, setLoggedInClientId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
    setView("client-dashboard");
  };

  const handleClientActivation = (c: Client, newPassword: string) => {
    setClients((prev) => prev.map((cl) => (cl.id === c.id ? { ...cl, password: newPassword } : cl)));
    setLoggedInClientId(c.id);
    setView("client-dashboard");
  };

  const handleClientLogout = () => {
    setLoggedInClientId(null);
    setView("landing");
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

  if (view === "client-dashboard" && loggedInClient) {
    return <ClientDashboard client={loggedInClient} onLogout={handleClientLogout} />;
  }

  if (view === "admin-login") {
    return <AdminLogin onLogin={() => setView("admin")} onBack={() => setView("landing")} />;
  }

  if (view === "admin") {
    return <AdminPanel clients={clients} setClients={setClients} onLogout={() => setView("landing")} />;
  }

  return null;
}
