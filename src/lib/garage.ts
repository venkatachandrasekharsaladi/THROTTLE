/**
 * Garage logic for the THROTTLE prototype: task status, grouping, cost
 * totals and the demo seed. Maintenance intervals are user-entered
 * reminders — sample values are demonstration data, not manufacturer
 * recommendations.
 */
import { documents, motorcycle, serviceHistory } from "@/data/demo";
import type {
  BikeDocument,
  BikeGarage,
  CompletedTask,
  FuelRecord,
  GarageState,
  MaintenanceTask,
  MileageEntry,
  MileageUpdateMethod,
  Motorcycle,
  ServiceRecord,
  TaskStatus,
} from "@/types";

export const DUE_SOON_MILES = 500;
export const DUE_SOON_DAYS = 30;
export const EXPIRY_SOON_DAYS = 60;
/** Show a gentle "update your mileage" reminder after this many days. */
export const MILEAGE_STALE_DAYS = 21;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(iso: string, today: string): number {
  return Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
}

/** Derive a task's status from its due date/mileage against the bike. */
export function taskStatus(task: MaintenanceTask, bike: Motorcycle, today = todayISO()): TaskStatus {
  if (task.dueMileage != null && bike.mileage >= task.dueMileage) return "overdue";
  if (task.dueDate && task.dueDate <= today) return "overdue";
  if (task.dueMileage != null && task.dueMileage - bike.mileage <= DUE_SOON_MILES) return "dueSoon";
  if (task.dueDate && daysUntil(task.dueDate, today) <= DUE_SOON_DAYS) return "dueSoon";
  return "upcoming";
}

export function taskDueLabel(task: MaintenanceTask, bike: Motorcycle, today = todayISO()): string {
  const parts: string[] = [];
  if (task.dueMileage != null) {
    const remaining = task.dueMileage - bike.mileage;
    parts.push(
      remaining <= 0
        ? `${Math.abs(remaining).toLocaleString("en-GB")} mi overdue`
        : `due in ${remaining.toLocaleString("en-GB")} mi`,
    );
  }
  if (task.dueDate) {
    const days = daysUntil(task.dueDate, today);
    parts.push(days <= 0 ? "date passed" : days <= DUE_SOON_DAYS ? `due in ${days} days` : `due ${task.dueDate}`);
  }
  return parts.length ? parts.join(" · ") : "No due date set";
}

export interface GroupedTasks {
  overdue: MaintenanceTask[];
  dueSoon: MaintenanceTask[];
  upcoming: MaintenanceTask[];
  completed: CompletedTask[];
}

export function groupTasks(garage: BikeGarage, today = todayISO()): GroupedTasks {
  const groups: GroupedTasks = { overdue: [], dueSoon: [], upcoming: [], completed: garage.completed };
  for (const task of garage.tasks) groups[taskStatus(task, garage.bike, today) as "overdue" | "dueSoon" | "upcoming"].push(task);
  return groups;
}

/** Next open task: most urgent first, then soonest due. */
export function nextTask(garage: BikeGarage, today = todayISO()): MaintenanceTask | null {
  const order = { overdue: 0, dueSoon: 1, upcoming: 2 } as const;
  const sorted = [...garage.tasks].sort((a, b) => {
    const byStatus = order[taskStatus(a, garage.bike, today) as keyof typeof order] - order[taskStatus(b, garage.bike, today) as keyof typeof order];
    if (byStatus !== 0) return byStatus;
    return (a.dueMileage ?? Infinity) - (b.dueMileage ?? Infinity);
  });
  return sorted[0] ?? null;
}

export interface CostSummary {
  maintenanceGbp: number;
  serviceGbp: number;
  fuelGbp: number;
  recent: { id: string; title: string; date: string; costGbp: number; kind: "Maintenance" | "Service" | "Fuel" }[];
}

export function costSummary(garage: BikeGarage): CostSummary {
  const maintenanceGbp = garage.completed.reduce((sum, t) => sum + (t.costGbp ?? 0), 0);
  const serviceGbp = garage.services.reduce((sum, s) => sum + s.costGbp, 0);
  const fuelGbp = garage.fuelRecords.reduce((sum, f) => sum + f.costGbp, 0);
  const recent = [
    ...garage.completed
      .filter((t) => t.costGbp != null)
      .map((t) => ({ id: `m-${t.id}`, title: t.name, date: t.completedDate, costGbp: t.costGbp!, kind: "Maintenance" as const })),
    ...garage.services.map((s) => ({ id: `s-${s.id}`, title: s.title, date: s.date, costGbp: s.costGbp, kind: "Service" as const })),
    ...garage.fuelRecords.map((f) => ({
      id: `f-${f.id}`,
      title: f.station ? `Fuel · ${f.station}` : "Fuel",
      date: f.date,
      costGbp: f.costGbp,
      kind: "Fuel" as const,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  return { maintenanceGbp, serviceGbp, fuelGbp, recent };
}

export function documentExpiryStatus(doc: BikeDocument, today = todayISO()): { label: string; tone: "good" | "due" | "urgent" | "info" } {
  if (!doc.expiryDate) return { label: "Stored", tone: "info" };
  const days = daysUntil(doc.expiryDate, today);
  if (days < 0) return { label: "Expired", tone: "urgent" };
  if (days <= EXPIRY_SOON_DAYS) return { label: `Expires in ${days} days`, tone: "due" };
  return { label: "Valid", tone: "good" };
}

/* ---------- Central mileage record ---------- */

/** Days since the odometer was last updated; null when never updated. */
export function daysSinceMileageUpdate(bike: Motorcycle, today = todayISO()): number | null {
  if (!bike.lastMileageUpdatedAt) return null;
  return Math.max(0, daysUntil(today, bike.lastMileageUpdatedAt.slice(0, 10)));
}

export function mileageLastUpdatedLabel(bike: Motorcycle, today = todayISO()): string {
  const days = daysSinceMileageUpdate(bike, today);
  if (days == null) return "Kilometers not updated yet";
  if (days === 0) return "Kilometers updated today";
  if (days === 1) return "Kilometers updated yesterday";
  return `Kilometers last updated ${days} days ago`;
}

/**
 * Validate a new odometer reading. Readings must be positive and never go
 * backwards — except corrections, which fix a wrong earlier entry and are
 * recorded in the audit trail.
 */
export function validateMileageUpdate(current: number, next: number, method: MileageUpdateMethod): string | null {
  if (!Number.isFinite(next) || next <= 0) return "Enter a positive mileage.";
  if (method === "Correction") return null;
  if (next < current) return "New reading is lower than the current odometer. Use a correction to fix a wrong earlier entry.";
  if (next === current) return "New reading is the same as the current odometer.";
  return null;
}

export function buildMileageEntry(bike: Motorcycle, newMileage: number, method: MileageUpdateMethod, note?: string): MileageEntry {
  return {
    id: newId(),
    bikeId: bike.id,
    previousMileage: bike.mileage,
    newMileage,
    distanceMiles: newMileage - bike.mileage,
    updatedAt: new Date().toISOString(),
    method,
    note,
  };
}

/**
 * Apply an odometer change to the garage state: updates the bike's central
 * mileage record and prepends an audit-trail entry. Pure — returns an error
 * string instead of throwing so callers can show it inline.
 */
export function applyMileageUpdate(
  state: GarageState,
  bikeId: string,
  newMileage: number,
  method: MileageUpdateMethod,
  note?: string,
): { state: GarageState; entry: MileageEntry } | { error: string } {
  const target = state.bikes.find((b) => b.bike.id === bikeId);
  if (!target) return { error: "Bike not found." };
  const error = validateMileageUpdate(target.bike.mileage, newMileage, method);
  if (error) return { error };
  const entry = buildMileageEntry(target.bike, newMileage, method, note);
  return {
    entry,
    state: {
      ...state,
      bikes: state.bikes.map((b) =>
        b.bike.id === bikeId
          ? {
              ...b,
              bike: {
                ...b.bike,
                mileage: newMileage,
                mileageUnit: b.bike.mileageUnit ?? "mi",
                lastMileageUpdatedAt: entry.updatedAt,
              },
              mileageHistory: [entry, ...b.mileageHistory],
            }
          : b,
      ),
    },
  };
}

/* ---------- Demo seed ---------- */

const seedTasks: MaintenanceTask[] = [
  {
    id: "chain",
    name: "Chain clean & adjust",
    description: "Clean, lube and set slack to 50–55 mm.",
    category: "Chain",
    dueMileage: 12600,
    notes: "Demo reminder — set your own intervals.",
  },
  {
    id: "tyres",
    name: "Tyre pressure check",
    description: "Front 36 psi · Rear 42 psi (solo, cold).",
    category: "Tyres",
  },
  {
    id: "oil",
    name: "Engine oil & filter",
    description: "Next interval at 16,000 mi.",
    category: "Engine oil",
    dueMileage: 16000,
    lastCompletedDate: "2025-10-18",
    lastCompletedMileage: 6020,
  },
];

const seedCompleted: CompletedTask[] = [
  {
    id: "air-filter-done",
    name: "Air filter replacement",
    description: "Swap the paper air filter element.",
    category: "Air filter",
    completedDate: "2026-09-12",
    completedMileage: 11800,
    costGbp: 24,
    completionNotes: "Done during the major service.",
  },
];

const seedServices: ServiceRecord[] = serviceHistory.map((s) => ({ ...s }));

/** Demo mileage trail for the sample bike — ends at the seed odometer. */
const seedMileageHistory: MileageEntry[] = [
  {
    id: "mh-2",
    bikeId: motorcycle.id,
    previousMileage: 12102,
    newMileage: 12450,
    distanceMiles: 348,
    updatedAt: "2026-10-24T09:30:00.000Z",
    method: "Trip Entry",
    note: "Sample entry — Snake Pass run.",
  },
  {
    id: "mh-1",
    bikeId: motorcycle.id,
    previousMileage: 11800,
    newMileage: 12102,
    distanceMiles: 302,
    updatedAt: "2026-09-12T17:45:00.000Z",
    method: "Manual",
    note: "Sample entry.",
  },
];

/** Demo fill-ups; each keeps the mileage recorded at the time. */
const seedFuelRecords: FuelRecord[] = [
  { id: "f-3", date: "2026-10-24", litres: 11.8, costGbp: 18.53, mileage: 12448, fullTank: true, station: "Esso · Vauxhall Bridge Road", notes: "Sample fill-up." },
  { id: "f-2", date: "2026-10-10", litres: 12.4, costGbp: 19.35, mileage: 12150, fullTank: true, station: "Shell · Kennington Lane", notes: "Sample fill-up." },
  { id: "f-1", date: "2026-09-26", litres: 11.2, costGbp: 17.42, mileage: 11860, fullTank: true, station: "BP · Battersea Park Road", notes: "Sample fill-up." },
];

const seedDocuments: BikeDocument[] = documents.map((d) => ({
  id: d.id,
  title: d.title,
  type: d.id === "mot" ? "MOT certificate" : d.id === "insurance" ? "Insurance" : "Other",
  detail: d.detail,
  expiryDate: d.id === "mot" ? "2027-03-14" : d.id === "insurance" ? "2027-06-02" : undefined,
}));

export function seedGarage(): GarageState {
  return {
    activeId: motorcycle.id,
    bikes: [
      {
        bike: {
          ...motorcycle,
          mileageUnit: "mi",
          lastMileageUpdatedAt: "2026-10-24T09:30:00.000Z",
        },
        tasks: seedTasks.map((t) => ({ ...t })),
        completed: seedCompleted.map((t) => ({ ...t })),
        services: seedServices.map((s) => ({ ...s })),
        documents: seedDocuments.map((d) => ({ ...d })),
        mileageHistory: seedMileageHistory.map((m) => ({ ...m })),
        fuelRecords: seedFuelRecords.map((f) => ({ ...f })),
      },
    ],
  };
}

/* ---------- Storage validation ---------- */

interface LooseGarage {
  bikes?: unknown;
  activeId?: unknown;
}

interface LooseEntry {
  bike?: unknown;
  tasks?: unknown;
  completed?: unknown;
  services?: unknown;
  documents?: unknown;
  mileageHistory?: unknown;
  fuelRecords?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate stored garage data; fall back to the demo seed when invalid. */
export function normalizeGarage(value: unknown): GarageState {
  const loose = (isRecord(value) ? value : {}) as LooseGarage;
  if (!Array.isArray(loose.bikes) || loose.bikes.length === 0) return seedGarage();
  const bikes: BikeGarage[] = [];
  for (const rawEntry of loose.bikes) {
    const entry = (isRecord(rawEntry) ? rawEntry : {}) as LooseEntry;
    const bike = entry.bike;
    if (!isRecord(bike) || typeof bike["id"] !== "string") return seedGarage();
    bikes.push({
      bike: bike as unknown as Motorcycle,
      tasks: Array.isArray(entry.tasks) ? (entry.tasks as MaintenanceTask[]) : [],
      completed: Array.isArray(entry.completed) ? (entry.completed as CompletedTask[]) : [],
      services: Array.isArray(entry.services) ? (entry.services as ServiceRecord[]) : [],
      documents: Array.isArray(entry.documents) ? (entry.documents as BikeDocument[]) : [],
      mileageHistory: Array.isArray(entry.mileageHistory) ? (entry.mileageHistory as MileageEntry[]) : [],
      fuelRecords: Array.isArray(entry.fuelRecords) ? (entry.fuelRecords as FuelRecord[]) : [],
    });
  }
  const activeId =
    typeof loose.activeId === "string" && bikes.some((b) => b.bike.id === loose.activeId)
      ? loose.activeId
      : bikes[0]!.bike.id;
  return { activeId, bikes };
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
