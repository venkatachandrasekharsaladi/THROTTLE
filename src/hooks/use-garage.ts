import { useMemo } from "react";
import { applyMileageUpdate, normalizeGarage, seedGarage } from "@/lib/garage";
import type {
  BikeDocument,
  BikeGarage,
  CompletedTask,
  FuelRecord,
  GarageState,
  MaintenanceTask,
  MileageUpdateMethod,
  Motorcycle,
  ServiceRecord,
} from "@/types";
import { useLocalStorage } from "./use-local-storage";

/**
 * Prototype garage: every motorcycle with its tasks, service history and
 * documents, persisted in localStorage under `throttle:garage`.
 */
export function useGarage() {
  const [raw, setRaw] = useLocalStorage<GarageState>("garage", seedGarage());
  const state = useMemo(() => normalizeGarage(raw), [raw]);

  const update = (fn: (prev: GarageState) => GarageState) => setRaw((prev) => fn(normalizeGarage(prev)));

  const active: BikeGarage = state.bikes.find((b) => b.bike.id === state.activeId) ?? state.bikes[0]!;

  const patchBike = (bikeId: string, fn: (g: BikeGarage) => BikeGarage) =>
    update((prev) => ({
      ...prev,
      bikes: prev.bikes.map((g) => (g.bike.id === bikeId ? fn(g) : g)),
    }));

  return {
    state,
    active,
    setActive: (bikeId: string) => update((prev) => ({ ...prev, activeId: bikeId })),

    addBike: (bike: Motorcycle) =>
      update((prev) => ({
        activeId: bike.id,
        bikes: [
          ...prev.bikes,
          {
            bike: { ...bike, mileageUnit: bike.mileageUnit ?? "mi", lastMileageUpdatedAt: new Date().toISOString() },
            tasks: [],
            completed: [],
            services: [],
            documents: [],
            mileageHistory: [],
            fuelRecords: [],
          },
        ],
      })),
    updateBike: (bike: Motorcycle) => patchBike(bike.id, (g) => ({ ...g, bike })),
    deleteBike: (bikeId: string) =>
      update((prev) => {
        if (prev.bikes.length <= 1) return prev;
        const bikes = prev.bikes.filter((g) => g.bike.id !== bikeId);
        return { bikes, activeId: prev.activeId === bikeId ? bikes[0]!.bike.id : prev.activeId };
      }),

    addTask: (bikeId: string, task: MaintenanceTask) => patchBike(bikeId, (g) => ({ ...g, tasks: [...g.tasks, task] })),
    updateTask: (bikeId: string, task: MaintenanceTask) =>
      patchBike(bikeId, (g) => ({ ...g, tasks: g.tasks.map((t) => (t.id === task.id ? task : t)) })),
    deleteTask: (bikeId: string, taskId: string) =>
      patchBike(bikeId, (g) => ({
        ...g,
        tasks: g.tasks.filter((t) => t.id !== taskId),
        completed: g.completed.filter((t) => t.id !== taskId),
      })),
    completeTask: (bikeId: string, taskId: string, record: Pick<CompletedTask, "completedDate" | "completedMileage" | "costGbp" | "completionNotes">) =>
      patchBike(bikeId, (g) => {
        const task = g.tasks.find((t) => t.id === taskId);
        if (!task) return g;
        const done: CompletedTask = {
          ...task,
          ...record,
          lastCompletedDate: record.completedDate,
          lastCompletedMileage: record.completedMileage,
        };
        return { ...g, tasks: g.tasks.filter((t) => t.id !== taskId), completed: [done, ...g.completed] };
      }),

    addService: (bikeId: string, record: ServiceRecord) =>
      patchBike(bikeId, (g) => ({ ...g, services: [...g.services, record] })),
    updateService: (bikeId: string, record: ServiceRecord) =>
      patchBike(bikeId, (g) => ({ ...g, services: g.services.map((s) => (s.id === record.id ? record : s)) })),
    deleteService: (bikeId: string, recordId: string) =>
      patchBike(bikeId, (g) => ({ ...g, services: g.services.filter((s) => s.id !== recordId) })),

    addDocument: (bikeId: string, doc: BikeDocument) =>
      patchBike(bikeId, (g) => ({ ...g, documents: [...g.documents, doc] })),
    updateDocument: (bikeId: string, doc: BikeDocument) =>
      patchBike(bikeId, (g) => ({ ...g, documents: g.documents.map((d) => (d.id === doc.id ? doc : d)) })),
    deleteDocument: (bikeId: string, docId: string) =>
      patchBike(bikeId, (g) => ({ ...g, documents: g.documents.filter((d) => d.id !== docId) })),

    /**
     * Central odometer update — the only way mileage changes after setup.
     * Returns an error string, or null on success. Every success appends an
     * audit-trail entry; corrections may lower the reading but are recorded.
     */
    updateMileage: (bikeId: string, newMileage: number, method: MileageUpdateMethod, note?: string): string | null => {
      let error: string | null = null;
      update((prev) => {
        const result = applyMileageUpdate(prev, bikeId, newMileage, method, note);
        if ("error" in result) {
          error = result.error;
          return prev;
        }
        return result.state;
      });
      return error;
    },
    /** Secondary entry path: adds a trip distance on top of the current reading. */
    addTripDistance: (bikeId: string, tripMiles: number): string | null => {
      if (!Number.isFinite(tripMiles) || tripMiles <= 0) return "Enter a positive trip distance.";
      const current = state.bikes.find((b) => b.bike.id === bikeId)?.bike.mileage;
      if (current == null) return "Bike not found.";
      const rounded = Math.round(tripMiles);
      let error: string | null = null;
      update((prev) => {
        const result = applyMileageUpdate(prev, bikeId, current + rounded, "Trip Entry", `Trip of ${rounded} mi`);
        if ("error" in result) {
          error = result.error;
          return prev;
        }
        return result.state;
      });
      return error;
    },

    addFuelRecord: (bikeId: string, record: FuelRecord) =>
      patchBike(bikeId, (g) => ({ ...g, fuelRecords: [record, ...g.fuelRecords] })),
    updateFuelRecord: (bikeId: string, record: FuelRecord) =>
      patchBike(bikeId, (g) => ({ ...g, fuelRecords: g.fuelRecords.map((f) => (f.id === record.id ? record : f)) })),
    deleteFuelRecord: (bikeId: string, recordId: string) =>
      patchBike(bikeId, (g) => ({ ...g, fuelRecords: g.fuelRecords.filter((f) => f.id !== recordId) })),
  };
}
