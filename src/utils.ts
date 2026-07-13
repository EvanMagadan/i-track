import { TODAY } from "./data";

export function daysDiff(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.floor((TODAY.getTime() - d.getTime()) / 86400000);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}

export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function advanceDueDate(dateStr: string): string {
  const [y, mo, da] = dateStr.split("-").map(Number);
  const targetYear = mo === 12 ? y + 1 : y;
  const nextMonthNum = mo === 12 ? 1 : mo + 1;
  const lastDay = new Date(targetYear, nextMonthNum, 0).getDate();
  const newDay = Math.min(da, lastDay);
  return `${targetYear}-${String(nextMonthNum).padStart(2, "0")}-${String(newDay).padStart(2, "0")}`;
}

export function monthLabel(dateStr: string): string {
  const [y, mo] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}
