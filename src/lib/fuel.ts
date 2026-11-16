/**
 * Fuel analytics for the THROTTLE prototype: UK MPG (full-to-full method),
 * spend totals and monthly series. All figures derive from the per-bike
 * fuelRecords stored in the garage — no separate fuel database.
 */
import type { FuelRecord } from "@/types";

export const LITRES_PER_UK_GALLON = 4.54609;

/** Price per litre in pence, derived — never stored. */
export function pricePerLitrePence(record: Pick<FuelRecord, "litres" | "costGbp">): number | null {
  if (record.litres <= 0) return null;
  return (record.costGbp / record.litres) * 100;
}

export interface FuelStats {
  totalSpendGbp: number;
  totalLitres: number;
  /** UK MPG from full-to-full fills; null when fewer than two full-tank records. */
  averageMpg: number | null;
  lastFillDate: string | null; // ISO
  recordCount: number;
}

function byMileage(records: FuelRecord[]): FuelRecord[] {
  return [...records].sort((a, b) => a.mileage - b.mileage);
}

/**
 * Full-to-full MPG: between two consecutive full-tank fills, the second fill's
 * litres replace exactly the fuel burned over the miles between them. Partial
 * fills are skipped for MPG but still count towards spend and litres.
 */
export function fuelStats(records: FuelRecord[]): FuelStats {
  const totalSpendGbp = records.reduce((sum, r) => sum + r.costGbp, 0);
  const totalLitres = records.reduce((sum, r) => sum + r.litres, 0);
  const lastFillDate = records.map((r) => r.date).sort().at(-1) ?? null;

  const fulls = byMileage(records.filter((r) => r.fullTank));
  let miles = 0;
  let litres = 0;
  for (let i = 1; i < fulls.length; i++) {
    const gap = fulls[i]!.mileage - fulls[i - 1]!.mileage;
    if (gap > 0) {
      miles += gap;
      litres += fulls[i]!.litres;
    }
  }
  const averageMpg = litres > 0 ? miles / (litres / LITRES_PER_UK_GALLON) : null;

  return { totalSpendGbp, totalLitres, averageMpg, lastFillDate, recordCount: records.length };
}

export interface MonthSpend {
  /** e.g. "2026-10" */
  key: string;
  /** e.g. "Oct" */
  label: string;
  totalGbp: number;
  litres: number;
}

/** Spend per calendar month, oldest first, covering the last `months` months. */
export function monthlySpend(records: FuelRecord[], months = 6, today = new Date()): MonthSpend[] {
  const buckets = new Map<string, MonthSpend>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    buckets.set(key, {
      key,
      label: d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }),
      totalGbp: 0,
      litres: 0,
    });
  }
  for (const r of records) {
    const bucket = buckets.get(r.date.slice(0, 7));
    if (bucket) {
      bucket.totalGbp += r.costGbp;
      bucket.litres += r.litres;
    }
  }
  return [...buckets.values()];
}
