import { describe, expect, it } from "vitest";
import { fuelStats, monthlySpend, pricePerLitrePence, LITRES_PER_UK_GALLON } from "@/lib/fuel";
import type { FuelRecord } from "@/types";

const fill = (over: Partial<FuelRecord>): FuelRecord => ({
  id: over.id ?? "f",
  date: over.date ?? "2026-10-01",
  litres: over.litres ?? 10,
  costGbp: over.costGbp ?? 15,
  mileage: over.mileage ?? 12000,
  ...over,
});

describe("pricePerLitrePence", () => {
  it("derives pence per litre from cost and litres", () => {
    expect(pricePerLitrePence({ litres: 11.8, costGbp: 18.53 })).toBeCloseTo(157.0, 0);
  });

  it("returns null for zero litres", () => {
    expect(pricePerLitrePence({ litres: 0, costGbp: 18.53 })).toBeNull();
  });
});

describe("fuelStats", () => {
  it("totals spend and litres across all records", () => {
    const stats = fuelStats([
      fill({ id: "a", litres: 10, costGbp: 15 }),
      fill({ id: "b", litres: 12, costGbp: 18, fullTank: false }),
    ]);
    expect(stats.totalSpendGbp).toBe(33);
    expect(stats.totalLitres).toBe(22);
    expect(stats.recordCount).toBe(2);
  });

  it("computes UK MPG from consecutive full-tank fills", () => {
    // 300 miles on 12 litres → 300 / (12 / 4.54609) ≈ 113.7 mpg
    const stats = fuelStats([
      fill({ id: "a", mileage: 12000, litres: 11, fullTank: true }),
      fill({ id: "b", mileage: 12300, litres: 12, fullTank: true }),
    ]);
    expect(stats.averageMpg).toBeCloseTo(300 / (12 / LITRES_PER_UK_GALLON), 1);
  });

  it("ignores partial fills for MPG but keeps them in totals", () => {
    const stats = fuelStats([
      fill({ id: "a", mileage: 12000, litres: 11, fullTank: true, costGbp: 10 }),
      fill({ id: "p", mileage: 12100, litres: 5, fullTank: false, costGbp: 8 }),
      fill({ id: "b", mileage: 12300, litres: 12, fullTank: true, costGbp: 12 }),
    ]);
    expect(stats.averageMpg).toBeCloseTo(300 / (12 / LITRES_PER_UK_GALLON), 1);
    expect(stats.totalLitres).toBe(28);
    expect(stats.totalSpendGbp).toBe(30);
  });

  it("returns null MPG with fewer than two full-tank fills", () => {
    expect(fuelStats([fill({ fullTank: true })]).averageMpg).toBeNull();
    expect(fuelStats([]).averageMpg).toBeNull();
  });

  it("reports the most recent fill-up date", () => {
    const stats = fuelStats([
      fill({ id: "a", date: "2026-09-26" }),
      fill({ id: "b", date: "2026-10-24" }),
    ]);
    expect(stats.lastFillDate).toBe("2026-10-24");
  });
});

describe("monthlySpend", () => {
  const today = new Date(Date.UTC(2026, 9, 15)); // Oct 2026

  it("buckets spend into calendar months, oldest first", () => {
    const months = monthlySpend(
      [
        fill({ id: "a", date: "2026-10-04", costGbp: 20, litres: 12 }),
        fill({ id: "b", date: "2026-10-20", costGbp: 10, litres: 6 }),
        fill({ id: "c", date: "2026-08-11", costGbp: 5, litres: 3 }),
      ],
      3,
      today,
    );
    expect(months.map((m) => m.key)).toEqual(["2026-08", "2026-09", "2026-10"]);
    expect(months[0]!.totalGbp).toBe(5);
    expect(months[1]!.totalGbp).toBe(0);
    expect(months[2]!.totalGbp).toBe(30);
    expect(months[2]!.litres).toBe(18);
  });

  it("ignores records outside the window", () => {
    const months = monthlySpend([fill({ date: "2025-01-10", costGbp: 99 })], 2, today);
    expect(months.every((m) => m.totalGbp === 0)).toBe(true);
  });
});
