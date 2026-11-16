import { describe, expect, it } from "vitest";
import { costSummary, documentExpiryStatus, groupTasks, nextTask, normalizeGarage, seedGarage, taskStatus } from "@/lib/garage";
import type { BikeGarage, MaintenanceTask } from "@/types";

const TODAY = "2026-11-01";
const bike = { mileage: 12450 } as BikeGarage["bike"];

function task(partial: Partial<MaintenanceTask>): MaintenanceTask {
  return { id: "t", name: "Task", description: "", category: "Other", ...partial };
}

describe("task status", () => {
  it("is overdue when mileage is past due", () => {
    expect(taskStatus(task({ dueMileage: 12000 }), bike, TODAY)).toBe("overdue");
  });
  it("is overdue when the due date has passed", () => {
    expect(taskStatus(task({ dueDate: "2026-10-01" }), bike, TODAY)).toBe("overdue");
  });
  it("is due soon within 500 miles or 30 days", () => {
    expect(taskStatus(task({ dueMileage: 12900 }), bike, TODAY)).toBe("dueSoon");
    expect(taskStatus(task({ dueDate: "2026-11-20" }), bike, TODAY)).toBe("dueSoon");
  });
  it("is upcoming beyond both windows", () => {
    expect(taskStatus(task({ dueMileage: 16000 }), bike, TODAY)).toBe("upcoming");
    expect(taskStatus(task({ dueDate: "2027-06-01" }), bike, TODAY)).toBe("upcoming");
    expect(taskStatus(task({}), bike, TODAY)).toBe("upcoming");
  });
});

describe("grouping and next task", () => {
  const garage: BikeGarage = {
    bike,
    tasks: [
      task({ id: "a", dueMileage: 12000 }),
      task({ id: "b", dueMileage: 12800 }),
      task({ id: "c", dueMileage: 16000 }),
    ],
    completed: [],
    services: [],
    documents: [],
    mileageHistory: [],
    fuelRecords: [],
  };
  it("groups tasks into overdue, due soon and upcoming", () => {
    const g = groupTasks(garage, TODAY);
    expect(g.overdue.map((t) => t.id)).toEqual(["a"]);
    expect(g.dueSoon.map((t) => t.id)).toEqual(["b"]);
    expect(g.upcoming.map((t) => t.id)).toEqual(["c"]);
  });
  it("picks the most urgent next task", () => {
    expect(nextTask(garage, TODAY)?.id).toBe("a");
  });
});

describe("cost summary", () => {
  it("separates recorded maintenance and service spend", () => {
    const g: BikeGarage = {
      bike,
      tasks: [],
      completed: [{ ...task({ id: "x", name: "Chain" }), completedDate: "2026-10-01", completedMileage: 12000, costGbp: 30 }],
      services: [{ id: "s", title: "Service", mileage: 11800, date: "2026-09-12", costGbp: 385 }],
      documents: [],
      mileageHistory: [],
      fuelRecords: [{ id: "f", date: "2026-10-24", litres: 11.8, costGbp: 18.53, mileage: 12448 }],
    };
    const costs = costSummary(g);
    expect(costs.maintenanceGbp).toBe(30);
    expect(costs.serviceGbp).toBe(385);
    expect(costs.fuelGbp).toBe(18.53);
    expect(costs.recent.map((r) => r.kind)).toEqual(["Fuel", "Maintenance", "Service"]);
    expect(costs.recent.map((r) => r.title)).toContain("Chain");
  });
});

describe("document expiry", () => {
  it("flags expired and expiring documents", () => {
    expect(documentExpiryStatus({ id: "d", title: "MOT", type: "MOT certificate", expiryDate: "2026-10-01" }, TODAY).tone).toBe("urgent");
    expect(documentExpiryStatus({ id: "d", title: "MOT", type: "MOT certificate", expiryDate: "2026-11-15" }, TODAY).tone).toBe("due");
    expect(documentExpiryStatus({ id: "d", title: "MOT", type: "MOT certificate", expiryDate: "2027-06-01" }, TODAY).tone).toBe("good");
  });
});

describe("storage validation", () => {
  it("falls back to the demo seed on invalid data", () => {
    expect(normalizeGarage(null).bikes).toHaveLength(1);
    expect(normalizeGarage({ bikes: [] }).bikes).toHaveLength(1);
    expect(normalizeGarage("junk").activeId).toBe("shadow");
  });
  it("keeps valid stored data and repairs a stale active id", () => {
    const seed = seedGarage();
    const stored = { ...seed, activeId: "missing" };
    const normalized = normalizeGarage(stored);
    expect(normalized.activeId).toBe("shadow");
    expect(normalized.bikes[0]!.tasks).toHaveLength(3);
  });
});
