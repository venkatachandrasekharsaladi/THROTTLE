import { describe, expect, it } from "vitest";
import {
  applyMileageUpdate,
  daysSinceMileageUpdate,
  mileageLastUpdatedLabel,
  normalizeGarage,
  seedGarage,
  taskDueLabel,
  taskStatus,
  validateMileageUpdate,
} from "@/lib/garage";
import type { GarageState, MaintenanceTask } from "@/types";

const TODAY = "2026-11-01";

function updated(state: GarageState, mileage: number, method: "Manual" | "Trip Entry" | "Correction" = "Manual") {
  const result = applyMileageUpdate(state, state.activeId, mileage, method);
  if ("error" in result) throw new Error(result.error);
  return result;
}

describe("central mileage record", () => {
  it("TEST 1: updating 12,450 → 12,500 changes the single odometer and logs history", () => {
    const seed = seedGarage();
    const { state, entry } = updated(seed, 12500);
    const bike = state.bikes[0]!.bike;
    expect(bike.mileage).toBe(12500);
    expect(bike.mileageUnit).toBe("mi");
    expect(bike.lastMileageUpdatedAt).toBeTruthy();
    expect(entry.previousMileage).toBe(12450);
    expect(entry.newMileage).toBe(12500);
    expect(entry.distanceMiles).toBe(50);
    expect(entry.method).toBe("Manual");
    expect(entry.bikeId).toBe(bike.id);
    expect(state.bikes[0]!.mileageHistory[0]).toEqual(entry);
  });

  it("TEST 2: a task due at 12,800 shows 300 mi remaining at 12,500", () => {
    const { state } = updated(seedGarage(), 12500);
    const g = state.bikes[0]!;
    const task: MaintenanceTask = { id: "t", name: "Valve check", description: "", category: "Other", dueMileage: 12800 };
    expect(taskDueLabel(task, g.bike, TODAY)).toBe("due in 300 mi");
    expect(taskStatus(task, g.bike, TODAY)).toBe("dueSoon");
  });

  it("TEST 3: at 12,850 the same task shows 50 mi overdue", () => {
    const { state } = updated(seedGarage(), 12850);
    const g = state.bikes[0]!;
    const task: MaintenanceTask = { id: "t", name: "Valve check", description: "", category: "Other", dueMileage: 12800 };
    expect(taskDueLabel(task, g.bike, TODAY)).toBe("50 mi overdue");
    expect(taskStatus(task, g.bike, TODAY)).toBe("overdue");
  });

  it("TEST 5: updating one bike never touches another bike's mileage or history", () => {
    const seed = seedGarage();
    const other = {
      ...seed.bikes[0]!,
      bike: { ...seed.bikes[0]!.bike, id: "other-bike", mileage: 5000 },
      mileageHistory: [],
    };
    const two: GarageState = { activeId: "shadow", bikes: [...seed.bikes, other] };
    const result = applyMileageUpdate(two, "shadow", 12500, "Manual");
    if ("error" in result) throw new Error(result.error);
    const untouched = result.state.bikes.find((b) => b.bike.id === "other-bike")!;
    expect(untouched.bike.mileage).toBe(5000);
    expect(untouched.mileageHistory).toHaveLength(0);
  });

  it("TEST 6: mileage and history survive a storage round-trip", () => {
    const { state } = updated(seedGarage(), 12500);
    const restored = normalizeGarage(JSON.parse(JSON.stringify(state)));
    expect(restored.bikes[0]!.bike.mileage).toBe(12500);
    expect(restored.bikes[0]!.mileageHistory[0]!.newMileage).toBe(12500);
    expect(restored.bikes[0]!.bike.lastMileageUpdatedAt).toBe(state.bikes[0]!.bike.lastMileageUpdatedAt);
  });

  it("TEST 7: a lower reading is rejected; a correction is allowed and audited", () => {
    const seed = seedGarage();
    const rejected = applyMileageUpdate(seed, "shadow", 12000, "Manual");
    expect("error" in rejected && rejected.error).toMatch(/lower than the current odometer/);
    expect(validateMileageUpdate(12450, 12000, "Manual")).toBeTruthy();
    expect(validateMileageUpdate(12450, -5, "Manual")).toBeTruthy();

    const { state, entry } = updated(seed, 12000, "Correction");
    expect(state.bikes[0]!.bike.mileage).toBe(12000);
    expect(entry.method).toBe("Correction");
    expect(entry.distanceMiles).toBe(-450);
    // Audit trail: the earlier entries are still there, correction prepended.
    expect(state.bikes[0]!.mileageHistory.map((e) => e.id)).toContain("mh-1");
    expect(state.bikes[0]!.mileageHistory[0]!.method).toBe("Correction");
  });

  it("TEST 8: service and fuel records keep their original mileage after an update", () => {
    const { state } = updated(seedGarage(), 12850);
    const g = state.bikes[0]!;
    expect(g.services.map((s) => s.mileage)).toEqual([11800, 9650, 6020]);
    expect(g.fuelRecords.map((f) => f.mileage)).toEqual([12448, 12150, 11860]);
  });

  it("trip entry adds distance to the current reading", () => {
    const seed = seedGarage();
    const current = seed.bikes[0]!.bike.mileage;
    const { state, entry } = updated(seed, current + 50, "Trip Entry");
    expect(state.bikes[0]!.bike.mileage).toBe(12500);
    expect(entry.method).toBe("Trip Entry");
    expect(entry.distanceMiles).toBe(50);
  });
});

describe("mileage reminder", () => {
  it("counts days since the last update and labels them", () => {
    const seed = seedGarage();
    const bike = seed.bikes[0]!.bike; // lastMileageUpdatedAt 2026-10-24
    expect(daysSinceMileageUpdate(bike, TODAY)).toBe(8);
    expect(mileageLastUpdatedLabel(bike, TODAY)).toBe("Mileage last updated 8 days ago");
    expect(mileageLastUpdatedLabel({ ...bike, lastMileageUpdatedAt: undefined }, TODAY)).toBe("Mileage not updated yet");
    expect(mileageLastUpdatedLabel({ ...bike, lastMileageUpdatedAt: "2026-11-01T08:00:00.000Z" }, TODAY)).toBe("Mileage updated today");
  });
});

describe("storage migration", () => {
  it("older stored garages without mileage history still load", () => {
    const seed = seedGarage();
    const legacy = JSON.parse(JSON.stringify(seed)) as Record<string, unknown>;
    for (const b of (legacy as { bikes: Record<string, unknown>[] }).bikes) {
      delete b["mileageHistory"];
      delete b["fuelRecords"];
    }
    const normalized = normalizeGarage(legacy);
    expect(normalized.bikes[0]!.mileageHistory).toEqual([]);
    expect(normalized.bikes[0]!.fuelRecords).toEqual([]);
    expect(normalized.bikes[0]!.bike.mileage).toBe(12450);
  });
});
