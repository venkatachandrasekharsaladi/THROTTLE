import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader, PageBody } from "@/components/throttle/app-header";
import { TButton } from "@/components/throttle/button";
import { MotorcycleCard } from "@/components/throttle/cards";
import { ConfirmDialog, Modal } from "@/components/throttle/dialogs";
import { BikeForm, CompleteTaskForm, DocumentForm, FuelForm, ServiceForm, TaskForm } from "@/components/throttle/garage-forms";
import { Icon } from "@/components/throttle/icon";
import { UpdateMileageDialog, type MileageDialogMode } from "@/components/throttle/mileage-dialog";
import { SectionCard } from "@/components/throttle/section-card";
import { DemoBadge, StatusIndicator } from "@/components/throttle/status-indicator";
import { useGarage } from "@/hooks/use-garage";
import { costSummary, documentExpiryStatus, groupTasks, mileageLastUpdatedLabel, taskDueLabel, taskStatus } from "@/lib/garage";
import { formatDate, formatDateTime, formatGbp, formatMiles, formatNumber } from "@/lib/format";
import type { BikeDocument, CompletedTask, FuelRecord, MaintenanceTask, ServiceRecord, TaskStatus } from "@/types";

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  overdue: "Overdue",
  dueSoon: "Due soon",
  upcoming: "Upcoming",
  completed: "Completed",
};

const TASK_STATUS_TONE: Record<TaskStatus, "urgent" | "due" | "good" | "info"> = {
  overdue: "urgent",
  dueSoon: "due",
  upcoming: "good",
  completed: "info",
};

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label-caps text-secondary">{label}</dt>
      <dd className="mt-0.5 text-data-md">{value}</dd>
    </div>
  );
}

type DialogState =
  | { kind: "addBike" }
  | { kind: "editBike" }
  | { kind: "deleteBike" }
  | { kind: "addTask" }
  | { kind: "editTask"; task: MaintenanceTask }
  | { kind: "taskDetail"; task: MaintenanceTask | CompletedTask; completed: boolean }
  | { kind: "completeTask"; task: MaintenanceTask }
  | { kind: "deleteTask"; task: MaintenanceTask | CompletedTask }
  | { kind: "addService" }
  | { kind: "editService"; record: ServiceRecord }
  | { kind: "deleteService"; record: ServiceRecord }
  | { kind: "addDocument" }
  | { kind: "editDocument"; doc: BikeDocument }
  | { kind: "deleteDocument"; doc: BikeDocument }
  | { kind: "updateMileage"; mode: MileageDialogMode }
  | { kind: "addFuel" }
  | { kind: "editFuel"; record: FuelRecord }
  | { kind: "deleteFuel"; record: FuelRecord }
  | null;

export function BikePage() {
  const garage = useGarage();
  const { active } = garage;
  const bike = active.bike;
  const [dialog, setDialog] = useState<DialogState>(null);
  const close = () => setDialog(null);

  const groups = groupTasks(active);
  const costs = costSummary(active);
  const openCount = groups.overdue.length + groups.dueSoon.length;
  const services = [...active.services].sort((a, b) => b.date.localeCompare(a.date));
  const fuelRecords = [...active.fuelRecords].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <AppHeader
        title="My Bike"
        actions={
          <TButton variant="secondary" size="sm" onClick={() => setDialog({ kind: "addBike" })}>
            <Icon name="add" className="text-[18px]" /> Add bike
          </TButton>
        }
      />
      <PageBody>
        {/* Bike switcher */}
        <section aria-label="Your motorcycles" className="flex flex-col gap-2">
          <p className="text-label-caps text-secondary">Your bikes</p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {garage.state.bikes.map((g) => {
              const isActive = g.bike.id === bike.id;
              return (
                <button
                  key={g.bike.id}
                  type="button"
                  onClick={() => garage.setActive(g.bike.id)}
                  aria-pressed={isActive}
                  className={`hairline-card flex min-w-36 flex-col items-start gap-0.5 p-3 text-left transition-colors ${
                    isActive ? "race-plate border-secondary" : "hover:bg-elevated"
                  }`}
                >
                  <span className="text-headline-sm">“{g.bike.nickname}”</span>
                  <span className="text-xs text-muted-foreground">
                    {g.bike.year} {g.bike.make} {g.bike.model}
                  </span>
                  {isActive && <span className="mt-1 text-mono-badge text-primary">Active</span>}
                </button>
              );
            })}
          </div>
        </section>

        <MotorcycleCard
          bike={bike}
          priority
          badge={<DemoBadge className="bg-background/90" />}
          footer={
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-label-caps text-secondary">ODOMETER</p>
                <p className="text-data-lg">{formatNumber(bike.mileage)} {bike.mileageUnit === "km" ? "km" : "mi"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{mileageLastUpdatedLabel(bike)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {bike.registration && (
                  <div className="text-right">
                    <p className="text-label-caps text-secondary">Registration</p>
                    <p className="text-data-md">{bike.registration}</p>
                  </div>
                )}
                <TButton variant="secondary" size="sm" onClick={() => setDialog({ kind: "updateMileage", mode: "manual" })}>
                  <Icon name="speed" className="text-[18px]" /> Update mileage
                </TButton>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-2">
          <TButton variant="outline" onClick={() => setDialog({ kind: "editBike" })}>
            <Icon name="edit" className="text-[18px]" /> Edit bike
          </TButton>
          <TButton
            variant="outline"
            onClick={() => setDialog({ kind: "deleteBike" })}
            disabled={garage.state.bikes.length <= 1}
          >
            <Icon name="delete" className="text-[18px]" /> Delete bike
          </TButton>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 1. Bike details */}
          <SectionCard id="details" icon="two_wheeler" title="Bike details" meta="Specs">
            <dl className="grid grid-cols-2 gap-4">
              <Spec label="Engine" value={`${bike.engineCc}cc`} />
              {bike.engineType && <Spec label="Layout" value={bike.engineType} />}
              {bike.power && <Spec label="Power" value={bike.power} />}
              {bike.kerbWeightKg != null && <Spec label="Kerb weight" value={`${bike.kerbWeightKg} kg`} />}
              <Spec label="Year" value={String(bike.year)} />
              {bike.colour && <Spec label="Colour" value={bike.colour} />}
              {bike.purchaseDate && <Spec label="Purchased" value={formatDate(bike.purchaseDate)} />}
              {bike.purchasePriceGbp != null && <Spec label="Purchase price" value={formatGbp(bike.purchasePriceGbp)} />}
            </dl>
            {bike.notes && <p className="mt-3 text-sm text-muted-foreground">{bike.notes}</p>}
          </SectionCard>

          {/* 2. Mileage — central odometer record */}
          <SectionCard id="mileage" icon="speed" title="Mileage" meta={mileageLastUpdatedLabel(bike)}>
            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-inset p-4 text-center">
                <p className="text-label-caps text-secondary">Odometer</p>
                <p className="mt-1 text-hero">{formatNumber(bike.mileage)}</p>
                <p className="text-mono-badge text-muted-foreground">{bike.mileageUnit === "km" ? "kilometres" : "miles"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TButton variant="primary" onClick={() => setDialog({ kind: "updateMileage", mode: "manual" })}>
                  <Icon name="speed" className="text-[18px]" /> Update mileage
                </TButton>
                <TButton variant="secondary" onClick={() => setDialog({ kind: "updateMileage", mode: "trip" })}>
                  <Icon name="route" className="text-[18px]" /> Add trip
                </TButton>
              </div>
              <div>
                <p className="mb-1.5 text-label-caps text-secondary">TRAVEL HISTORY</p>
                {active.mileageHistory.length === 0 ? (
                  <p className="rounded-lg bg-inset p-3 text-sm text-muted-foreground">
                    No updates yet — your first reading will appear here.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {active.mileageHistory.map((entry) => (
                      <li key={entry.id} className="flex items-center justify-between gap-3 rounded-lg bg-inset p-3">
                        <div className="min-w-0">
                          <p className="font-bold">
                            {formatNumber(entry.previousMileage)} → {formatNumber(entry.newMileage)} mi
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.method} · {formatDateTime(entry.updatedAt)}
                          </p>
                          {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                        </div>
                        <span className={`shrink-0 text-data-md font-bold ${entry.distanceMiles < 0 ? "text-primary" : ""}`}>
                          {entry.distanceMiles >= 0 ? "+" : ""}
                          {formatNumber(entry.distanceMiles)} mi
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </SectionCard>

          {/* 3. Maintenance */}
          <SectionCard
            id="maintenance"
            icon="tune"
            title="Maintenance"
            meta={openCount > 0 ? <StatusIndicator status="urgent" label={`${openCount} need attention`} /> : "Up to date"}
          >
            <div className="flex flex-col gap-3">
              {(["overdue", "dueSoon", "upcoming"] as const).map((group) =>
                groups[group].length === 0 ? null : (
                  <div key={group}>
                    <p className="mb-1.5 text-label-caps text-secondary">{TASK_STATUS_LABEL[group]}</p>
                    <ul className="flex flex-col gap-2">
                      {groups[group].map((task) => (
                        <li key={task.id}>
                          <button
                            type="button"
                            onClick={() => setDialog({ kind: "taskDetail", task, completed: false })}
                            className="flex w-full items-center justify-between gap-3 rounded-lg bg-inset p-3 text-left transition-colors hover:bg-elevated"
                          >
                            <div className="min-w-0">
                              <p className="font-bold">{task.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {task.category} · {taskDueLabel(task, bike)}
                              </p>
                            </div>
                            <StatusIndicator status={TASK_STATUS_TONE[taskStatus(task, bike)]} label={TASK_STATUS_LABEL[taskStatus(task, bike)]} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
              {groups.completed.length > 0 && (
                <div>
                  <p className="mb-1.5 text-label-caps text-secondary">Completed</p>
                  <ul className="flex flex-col gap-2">
                    {groups.completed.map((task) => (
                      <li key={task.id}>
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: "taskDetail", task, completed: true })}
                          className="flex w-full items-center justify-between gap-3 rounded-lg bg-inset p-3 text-left transition-colors hover:bg-elevated"
                        >
                          <div className="min-w-0">
                            <p className="font-bold">{task.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Done {formatDate(task.completedDate)} at {formatNumber(task.completedMileage)} mi
                            </p>
                          </div>
                          <StatusIndicator status="info" label="Completed" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {active.tasks.length === 0 && groups.completed.length === 0 && (
                <p className="rounded-lg bg-inset p-3 text-sm text-muted-foreground">
                  No maintenance tasks yet. Add your first reminder — intervals are yours to set.
                </p>
              )}
              <TButton variant="secondary" onClick={() => setDialog({ kind: "addTask" })}>
                <Icon name="add" className="text-[18px]" /> Add task
              </TButton>
            </div>
          </SectionCard>

          {/* 4. Service history */}
          <SectionCard id="history" icon="history" title="Service history" meta={`${services.length} logged`}>
            <div className="flex flex-col gap-3">
              {services.length === 0 ? (
                <p className="rounded-lg bg-inset p-3 text-sm text-muted-foreground">No service records yet for this bike.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {services.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: "editService", record: s })}
                        className="flex w-full justify-between gap-3 border-l-2 border-primary pl-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="font-bold">{s.title}</p>
                          <p className="text-sm text-muted-foreground">{s.workshop ?? "No garage recorded"}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-data-md font-bold">{formatNumber(s.mileage)} mi</p>
                          <p className="text-mono-badge text-secondary">{formatDate(s.date)}</p>
                          <p className="text-data-md text-muted-foreground">{formatGbp(s.costGbp)}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <TButton variant="secondary" onClick={() => setDialog({ kind: "addService" })}>
                <Icon name="add" className="text-[18px]" /> Add service record
              </TButton>
            </div>
          </SectionCard>

          {/* 5. Fuel & costs */}
          <SectionCard id="fuel" icon="local_gas_station" title="Fuel & costs" meta="This bike">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Maintenance", formatGbp(costs.maintenanceGbp)],
                ["Services", formatGbp(costs.serviceGbp)],
                ["Fuel", formatGbp(costs.fuelGbp)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-inset p-3 text-center">
                  <p className="text-label-caps text-secondary">{label}</p>
                  <p className="mt-1 text-data-md font-bold">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Totals come from your own records. Entries marked “Sample fill-up” are demo data.
            </p>
            {fuelRecords.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-label-caps text-secondary">Fill-ups</p>
                <ul className="flex flex-col gap-2">
                  {fuelRecords.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: "editFuel", record: f })}
                        className="flex w-full items-center justify-between gap-3 rounded-lg bg-inset p-3 text-left transition-colors hover:bg-elevated"
                      >
                        <div className="min-w-0">
                          <p className="font-bold">{f.station ?? "Fuel"}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(f.date)} · {f.litres} L at {formatNumber(f.mileage)} mi
                          </p>
                          {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
                        </div>
                        <p className="shrink-0 text-data-md font-bold">{formatGbp(f.costGbp)}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <TButton variant="secondary" onClick={() => setDialog({ kind: "addFuel" })}>
                <Icon name="add" className="text-[18px]" /> Log fuel
              </TButton>
              <Link to="/fuel" className="inline-flex h-11 items-center gap-1.5 rounded-lg px-4 text-label-caps text-primary hover:underline">
                <Icon name="monitoring" className="text-[18px]" /> Fuel dashboard
              </Link>
            </div>
            {costs.recent.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-label-caps text-secondary">Recent expenses</p>
                <ul className="flex flex-col gap-2">
                  {costs.recent.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-inset p-3">
                      <div className="min-w-0">
                        <p className="font-bold">{r.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {r.kind} · {formatDate(r.date)}
                        </p>
                      </div>
                      <p className="text-data-md font-bold">{formatGbp(r.costGbp)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>

          {/* 6. Documents */}
          <SectionCard id="documents" icon="folder" title="Documents" meta={`${active.documents.length} stored`} className="lg:col-span-2">
            <div className="flex flex-col gap-3">
              {active.documents.length === 0 ? (
                <p className="rounded-lg bg-inset p-3 text-sm text-muted-foreground">No documents yet. Add MOT, insurance or warranty details.</p>
              ) : (
                <ul className="grid gap-2 md:grid-cols-2">
                  {active.documents.map((doc) => {
                    const expiry = documentExpiryStatus(doc);
                    return (
                      <li key={doc.id}>
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: "editDocument", doc })}
                          className="flex w-full items-center gap-3 rounded-lg bg-inset p-3 text-left transition-colors hover:bg-elevated"
                        >
                          <Icon name="description" className="text-secondary" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold">{doc.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.type}
                              {doc.expiryDate ? ` · expires ${formatDate(doc.expiryDate)}` : ""}
                            </p>
                          </div>
                          <StatusIndicator status={expiry.tone} label={expiry.label} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div>
                <TButton variant="secondary" onClick={() => setDialog({ kind: "addDocument" })}>
                  <Icon name="add" className="text-[18px]" /> Add document
                </TButton>
              </div>
            </div>
          </SectionCard>
        </div>
      </PageBody>

      {/* Bike dialogs */}
      <Modal open={dialog?.kind === "addBike"} onOpenChange={(o) => !o && close()} title="Add motorcycle" description="Only the basics are needed — everything else is optional.">
        <BikeForm onSubmit={(b) => { garage.addBike(b); close(); }} onCancel={close} />
      </Modal>
      <Modal open={dialog?.kind === "editBike"} onOpenChange={(o) => !o && close()} title="Edit motorcycle">
        <BikeForm initial={bike} onSubmit={(b) => { garage.updateBike(b); close(); }} onCancel={close} />
      </Modal>
      <ConfirmDialog
        open={dialog?.kind === "deleteBike"}
        onOpenChange={(o) => !o && close()}
        title={`Delete “${bike.nickname}”?`}
        description="This removes the bike and all its maintenance, service and document records from this device. This cannot be undone."
        confirmLabel="Delete bike"
        onConfirm={() => { garage.deleteBike(bike.id); close(); }}
      />

      {/* Task dialogs */}
      <Modal open={dialog?.kind === "addTask"} onOpenChange={(o) => !o && close()} title="Add maintenance task">
        <TaskForm onSubmit={(t) => { garage.addTask(bike.id, t); close(); }} onCancel={close} />
      </Modal>
      <Modal open={dialog?.kind === "editTask"} onOpenChange={(o) => !o && close()} title="Edit task">
        {dialog?.kind === "editTask" && (
          <TaskForm initial={dialog.task} onSubmit={(t) => { garage.updateTask(bike.id, t); close(); }} onCancel={close} />
        )}
      </Modal>
      <Modal
        open={dialog?.kind === "taskDetail"}
        onOpenChange={(o) => !o && close()}
        title={dialog?.kind === "taskDetail" ? dialog.task.name : ""}
        description={dialog?.kind === "taskDetail" ? dialog.task.category : undefined}
      >
        {dialog?.kind === "taskDetail" && (
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-2 gap-3">
              <Spec label="Status" value={dialog.completed ? "Completed" : TASK_STATUS_LABEL[taskStatus(dialog.task, bike)]} />
              {dialog.task.dueDate && <Spec label="Due date" value={formatDate(dialog.task.dueDate)} />}
              {dialog.task.dueMileage != null && <Spec label="Due mileage" value={`${formatNumber(dialog.task.dueMileage)} mi`} />}
              {dialog.task.lastCompletedDate && <Spec label="Last done" value={formatDate(dialog.task.lastCompletedDate)} />}
              {dialog.task.lastCompletedMileage != null && <Spec label="Last done at" value={`${formatNumber(dialog.task.lastCompletedMileage)} mi`} />}
              {dialog.completed && <Spec label="Completed" value={formatDate((dialog.task as CompletedTask).completedDate)} />}
              {dialog.completed && <Spec label="Completed at" value={`${formatNumber((dialog.task as CompletedTask).completedMileage)} mi`} />}
              {dialog.completed && (dialog.task as CompletedTask).costGbp != null && (
                <Spec label="Cost" value={formatGbp((dialog.task as CompletedTask).costGbp!)} />
              )}
            </dl>
            {dialog.task.description && <p className="text-sm text-muted-foreground">{dialog.task.description}</p>}
            {dialog.task.notes && <p className="text-sm text-muted-foreground">Notes: {dialog.task.notes}</p>}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {!dialog.completed && (
                <>
                  <TButton variant="secondary" onClick={() => setDialog({ kind: "editTask", task: dialog.task })}>
                    Edit task
                  </TButton>
                  <TButton variant="primary" onClick={() => setDialog({ kind: "completeTask", task: dialog.task })}>
                    Mark complete
                  </TButton>
                </>
              )}
              <TButton variant="outline" onClick={() => setDialog({ kind: "deleteTask", task: dialog.task })}>
                Delete task
              </TButton>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={dialog?.kind === "completeTask"} onOpenChange={(o) => !o && close()} title="Mark as complete">
        {dialog?.kind === "completeTask" && (
          <CompleteTaskForm
            task={dialog.task}
            bikeMileage={bike.mileage}
            onSubmit={(record) => { garage.completeTask(bike.id, dialog.task.id, record); close(); }}
            onCancel={close}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={dialog?.kind === "deleteTask"}
        onOpenChange={(o) => !o && close()}
        title="Delete this task?"
        description={dialog?.kind === "deleteTask" ? `“${dialog.task.name}” and its completion record will be removed from this device.` : ""}
        confirmLabel="Delete task"
        onConfirm={() => { if (dialog?.kind === "deleteTask") garage.deleteTask(bike.id, dialog.task.id); close(); }}
      />

      {/* Service dialogs */}
      <Modal open={dialog?.kind === "addService"} onOpenChange={(o) => !o && close()} title="Add service record">
        <ServiceForm defaultMileage={bike.mileage} onSubmit={(r) => { garage.addService(bike.id, r); close(); }} onCancel={close} />
      </Modal>
      <Modal open={dialog?.kind === "editService"} onOpenChange={(o) => !o && close()} title="Service record">
        {dialog?.kind === "editService" && (
          <div className="flex flex-col gap-3">
            <ServiceForm initial={dialog.record} defaultMileage={bike.mileage} onSubmit={(r) => { garage.updateService(bike.id, r); close(); }} onCancel={close} />
            <TButton variant="outline" onClick={() => setDialog({ kind: "deleteService", record: dialog.record })}>
              <Icon name="delete" className="text-[18px]" /> Delete record
            </TButton>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={dialog?.kind === "deleteService"}
        onOpenChange={(o) => !o && close()}
        title="Delete service record?"
        description={dialog?.kind === "deleteService" ? `“${dialog.record.title}” will be removed from this bike's history.` : ""}
        confirmLabel="Delete record"
        onConfirm={() => { if (dialog?.kind === "deleteService") garage.deleteService(bike.id, dialog.record.id); close(); }}
      />

      {/* Document dialogs */}
      <Modal open={dialog?.kind === "addDocument"} onOpenChange={(o) => !o && close()} title="Add document" description="Metadata only — files stay on your device.">
        <DocumentForm onSubmit={(d) => { garage.addDocument(bike.id, d); close(); }} onCancel={close} />
      </Modal>
      <Modal open={dialog?.kind === "editDocument"} onOpenChange={(o) => !o && close()} title="Document">
        {dialog?.kind === "editDocument" && (
          <div className="flex flex-col gap-3">
            <DocumentForm initial={dialog.doc} onSubmit={(d) => { garage.updateDocument(bike.id, d); close(); }} onCancel={close} />
            <TButton variant="outline" onClick={() => setDialog({ kind: "deleteDocument", doc: dialog.doc })}>
              <Icon name="delete" className="text-[18px]" /> Delete document
            </TButton>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={dialog?.kind === "deleteDocument"}
        onOpenChange={(o) => !o && close()}
        title="Delete document?"
        description={dialog?.kind === "deleteDocument" ? `“${dialog.doc.title}” will be removed from this device.` : ""}
        confirmLabel="Delete document"
        onConfirm={() => { if (dialog?.kind === "deleteDocument") garage.deleteDocument(bike.id, dialog.doc.id); close(); }}
      />

      {/* Mileage + fuel dialogs */}
      <UpdateMileageDialog
        open={dialog?.kind === "updateMileage"}
        onOpenChange={(o) => !o && close()}
        bike={bike}
        initialMode={dialog?.kind === "updateMileage" ? dialog.mode : "manual"}
        onSave={(newMileage, method, note) => garage.updateMileage(bike.id, newMileage, method, note)}
      />
      <Modal open={dialog?.kind === "addFuel"} onOpenChange={(o) => !o && close()} title="Log fuel" description="Mileage is prefilled from the current odometer.">
        <FuelForm
          defaultMileage={bike.mileage}
          onSubmit={(r) => {
            garage.addFuelRecord(bike.id, r);
            if (r.mileage > bike.mileage) {
              const error = garage.updateMileage(bike.id, r.mileage, "Manual", "Logged with fuel purchase");
              if (error) toast.error(error);
              else toast.success(`Fuel logged — odometer updated to ${formatNumber(r.mileage)} mi`);
            } else {
              toast.success("Fuel logged");
            }
            close();
          }}
          onCancel={close}
        />
      </Modal>
      <Modal open={dialog?.kind === "editFuel"} onOpenChange={(o) => !o && close()} title="Fuel record">
        {dialog?.kind === "editFuel" && (
          <div className="flex flex-col gap-3">
            <FuelForm initial={dialog.record} defaultMileage={bike.mileage} onSubmit={(r) => { garage.updateFuelRecord(bike.id, r); close(); }} onCancel={close} />
            <TButton variant="outline" onClick={() => setDialog({ kind: "deleteFuel", record: dialog.record })}>
              <Icon name="delete" className="text-[18px]" /> Delete record
            </TButton>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={dialog?.kind === "deleteFuel"}
        onOpenChange={(o) => !o && close()}
        title="Delete fuel record?"
        description={dialog?.kind === "deleteFuel" ? `The fill-up from ${formatDate(dialog.record.date)} will be removed from this bike's records.` : ""}
        confirmLabel="Delete record"
        onConfirm={() => { if (dialog?.kind === "deleteFuel") garage.deleteFuelRecord(bike.id, dialog.record.id); close(); }}
      />
    </>
  );
}
