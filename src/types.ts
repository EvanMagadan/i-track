export type View =
  | "landing"
  | "client-login"
  | "client-signup"
  | "client-dashboard"
  | "admin-login"
  | "provider-signup"
  | "admin";

export type AdminTab = "overview" | "clients" | "calendar" | "alerts" | "settings";
export type ClientStatus = "active" | "overdue" | "disconnected" | "pending";

export interface Payment {
  id: string;
  month: string;
  date: string;
  amount: number;
  method: string;
}

export interface Client {
  id: string;
  email: string;
  name: string;
  address: string;
  plan: number;
  phone: string;
  installDate: string;
  dueDate: string;
  status: ClientStatus;
  payments: Payment[];
}

export interface ClientFormData {
  email: string;
  name: string;
  address: string;
  plan: string;
  phone: string;
  installDate: string;
  dueDate: string;
  status: ClientStatus;
}
