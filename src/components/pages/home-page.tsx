import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, PageBody } from "@/components/throttle/app-header";
import { TButton } from "@/components/throttle/button";
import { MaintenanceReminder, MotorcycleCard, RideEventCard } from "@/components/throttle/cards";
import { ConfirmDialog } from "@/components/throttle/dialogs";
import { Icon } from "@/components/throttle/icon";
import { UpdateMileageDialog } from "@/components/throttle/mileage-dialog";
import { SectionLabel } from "@/components/throttle/section-card";
import { DemoBadge, StatusIndicator } from "@/components/throttle/status-indicator";
import { rider, rides } from "@/data/demo";
import { useRidesGoing } from "@/hooks/use-demo-state";
import { useGarage } from "@/hooks/use-garage";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { MILEAGE_STALE_DAYS, daysSinceMileageUpdate, groupTasks, mileageLastUpdatedLabel, nextTask, taskDueLabel, taskStatus, todayISO } from "@/lib/garage";
import { formatNumber, greetingFor } from "@/lib/format";
import type { MaintenanceItem } from "@/types";

const QUICK_ACTIONS = [
  { to: "/fuel", icon: "local_gas_station", title: "Find petrol", sub: "Nearby prices" },
  { to: "/bike", icon: "two_wheeler", title: "My bike", sub: "Details & service" },
  { to: "/community", icon: "route", title: "Plan a ride", sub: "Group rides" },
] as const;

const STATUS_TONE = { overdue: "urgent", dueSoon: "due", upcoming: "good" } as const;

export function HomePage() {
  const [greeting, setGreeting] = useState("Hello");
  useEffect(() => setGreeting(greetingFor(new Date().getHours())), []);
  const garage = useGarage();
  const { active } = garage;
  const bike = active.bike;
  const [going, toggleGoing] = useRidesGoing();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mileageOpen, setMileageOpen] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useLocalStorage<Record<string, string>>("mileage-reminder", {});
  const navigate = useNavigate();
  const ride = rides[0]!;

  const staleDays = daysSinceMileageUpdate(bike);
  const showMileageReminder =
    staleDays != null && staleDays > MILEAGE_STALE_DAYS && reminderDismissed[bike.id] !== bike.lastMileageUpdatedAt;

  const next = nextTask(active);
  const groups = groupTasks(active);
  const attention = groups.overdue.length + groups.dueSoon.length;
  const reminder: MaintenanceItem | null = next
    ? {
        id: next.id,
        title: next.name,
        detail: next.description || next.category,
        dueLabel: taskDueLabel(next, bike),
        status: STATUS_TONE[taskStatus(next, bike) as keyof typeof STATUS_TONE],
      }
    : null;

  return (
    <>
      <AppHeader title="Home" />
      <PageBody>
        <section className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 text-mono-badge text-secondary">
              <span className="h-2 w-2 rounded-full bg-primary" /> {rider.location}
            </p>
            <h2 className="mt-1 text-headline-lg">
              {greeting}, {rider.firstName}
            </h2>
          </div>
          <DemoBadge />
        </section>

        {showMileageReminder && (
          <section
            aria-label="Mileage reminder"
            className="hairline-card flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-gold p-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold-foreground">
                <Icon name="speed" />
              </span>
              <div>
                <p className="text-headline-sm">Mileage check</p>
                <p className="text-sm text-muted-foreground">Last updated {staleDays} days ago. Update your mileage?</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TButton variant="secondary" size="sm" onClick={() => setMileageOpen(true)}>
                Update
              </TButton>
              <TButton
                variant="ghost"
                size="sm"
                onClick={() => setReminderDismissed((prev) => ({ ...prev, [bike.id]: bike.lastMileageUpdatedAt ?? "" }))}
              >
                Dismiss
              </TButton>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <MotorcycleCard
              bike={bike}
              priority
              badge={
                <span className="inline-flex items-center gap-1 rounded-sm bg-primary px-2 py-1 text-mono-badge text-primary-foreground">
                  <Icon name="check_circle" className="text-[14px]" /> Ready to ride
                </span>
              }
              footer={
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-label-caps text-secondary">Mileage</p>
                      <p className="text-data-lg">
                        {formatNumber(bike.mileage)} <span className="text-data-md text-muted-foreground">mi</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{mileageLastUpdatedLabel(bike)}</p>
                    </div>
                    <StatusIndicator
                      status={attention > 0 ? "due" : "good"}
                      label={attention > 0 ? `${attention} task${attention === 1 ? "" : "s"} to do` : "All tasks up to date"}
                      dot
                    />
                  </div>
                  <TButton variant="secondary" size="sm" onClick={() => setMileageOpen(true)}>
                    <Icon name="speed" className="text-[18px]" /> Update mileage
                  </TButton>
                </div>
              }
            />
          </div>
          <div className="flex flex-col gap-4 lg:col-span-2">
            {reminder ? (
              <MaintenanceReminder
                item={reminder}
                onView={() => navigate({ to: "/bike", hash: "maintenance" })}
                onLogDone={() => setConfirmOpen(true)}
              />
            ) : (
              <section aria-label="Upcoming maintenance" className="hairline-card border-l-4 border-l-success p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
                    <Icon name="task_alt" />
                  </span>
                  <div>
                    <p className="text-label-caps text-secondary">Upcoming maintenance</p>
                    <h3 className="text-headline-md">Nothing due</h3>
                  </div>
                </div>
                <p className="mt-3 text-muted-foreground">No open reminders for {bike.nickname}.</p>
                <div className="mt-4">
                  <Link to="/bike" hash="maintenance" className="text-label-caps text-primary hover:underline">
                    View all maintenance
                  </Link>
                </div>
              </section>
            )}
            <section className="flex flex-col gap-2">
              <SectionLabel>Quick actions</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_ACTIONS.map((a) => (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="hairline-card flex flex-col items-center gap-2 p-3 text-center transition-colors hover:bg-elevated"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-inset text-primary">
                      <Icon name={a.icon} className="text-[24px]" />
                    </span>
                    <span className="text-headline-sm">{a.title}</span>
                    <span className="text-xs text-muted-foreground">{a.sub}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <SectionLabel
            action={
              <Link to="/community" className="text-label-caps text-primary hover:underline">
                All rides
              </Link>
            }
          >
            Upcoming ride
          </SectionLabel>
          <RideEventCard ride={ride} going={going.includes(ride.id)} onToggleGoing={() => toggleGoing(ride.id)} compact />
        </section>
      </PageBody>

      <UpdateMileageDialog
        open={mileageOpen}
        onOpenChange={setMileageOpen}
        bike={bike}
        onSave={(newMileage, method, note) => garage.updateMileage(bike.id, newMileage, method, note)}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Log as done?"
        description={
          next
            ? `Mark “${next.name}” as done today at ${formatNumber(bike.mileage)} mi. You can add a cost later from My Bike.`
            : ""
        }
        confirmLabel="Log done"
        onConfirm={() => {
          if (next) garage.completeTask(bike.id, next.id, { completedDate: todayISO(), completedMileage: bike.mileage });
        }}
      />
    </>
  );
}
