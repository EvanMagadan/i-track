import type { Client } from "./types";

const DEFAULT_ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME ?? "admin";
const DEFAULT_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";

export const INITIAL_CLIENTS: Client[] = [];

export const ADMIN_CREDENTIALS = { username: DEFAULT_ADMIN_USERNAME, password: DEFAULT_ADMIN_PASSWORD };

export const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
