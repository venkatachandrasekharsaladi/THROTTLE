import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/format";
import { validateMileageUpdate } from "@/lib/garage";
import type { MileageUpdateMethod, Motorcycle } from "@/types";
import { TButton } from "./button";
import { Modal } from "./dialogs";
import { FormField, TextAreaField } from "./form-field";
import { Icon } from "./icon";

export type MileageDialogMode = "manual" | "trip" | "correction";

const MODES: { id: MileageDialogMode; label: string }[] = [
  { id: "manual", label: "Odometer" },
  { id: "trip", label: "Add trip" },
  { id: "correction", label: "Correction" },
];

const METHOD: Record<MileageDialogMode, MileageUpdateMethod> = {
  manual: "Manual",
  trip: "Trip Entry",
  correction: "Correction",
};

/**
 * Quick mileage update: manual odometer entry (primary), optional trip
 * distance, and a correction workflow that keeps the audit trail intact.
 */
export function UpdateMileageDialog({
  open,
  onOpenChange,
  bike,
  initialMode = "manual",
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bike: Motorcycle;
  initialMode?: MileageDialogMode;
  /** Returns an error string, or null on success. */
  onSave: (newMileage: number, method: MileageUpdateMethod, note?: string) => string | null;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Update mileage"
      description={`${bike.year} ${bike.make} ${bike.model} “${bike.nickname}”`}
    >
      {open && (
        <MileageForm
          key={`${bike.id}-${initialMode}`}
          bike={bike}
          initialMode={initialMode}
          onSave={onSave}
          onDone={() => onOpenChange(false)}
        />
      )}
    </Modal>
  );
}

function MileageForm({
  bike,
  initialMode,
  onSave,
  onDone,
}: {
  bike: Motorcycle;
  initialMode: MileageDialogMode;
  onSave: (newMileage: number, method: MileageUpdateMethod, note?: string) => string | null;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<MileageDialogMode>(initialMode);
  const [input, setInput] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parsed = Number(input);
  const hasValue = input.trim() !== "" && Number.isFinite(parsed);
  const newReading = mode === "trip" ? bike.mileage + Math.round(parsed) : Math.round(parsed);
  const difference = newReading - bike.mileage;
  const liveError = hasValue ? validateMileageUpdate(bike.mileage, newReading, METHOD[mode]) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!hasValue) {
      setError(mode === "trip" ? "Enter the trip distance in miles." : "Enter the new odometer reading.");
      return;
    }
    if (mode === "correction" && !note.trim()) {
      setError("Say what went wrong — corrections keep a note in the history.");
      return;
    }
    const result = onSave(newReading, METHOD[mode], mode === "correction" ? note.trim() : undefined);
    if (result) {
      setError(result);
      return;
    }
    toast.success(`Mileage updated — ${formatNumber(newReading)} mi`, {
      description:
        mode === "trip"
          ? `Trip of ${formatNumber(Math.round(parsed))} mi added to the odometer.`
          : mode === "correction"
            ? "Correction recorded in the mileage history."
            : `${difference >= 0 ? "+" : ""}${formatNumber(difference)} mi since the last reading.`,
    });
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="rounded-lg bg-inset p-4 text-center">
        <p className="text-label-caps text-secondary">Current odometer</p>
        <p className="mt-1 text-hero">{formatNumber(bike.mileage)}</p>
        <p className="text-mono-badge text-muted-foreground">miles</p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-inset p-1" role="group" aria-label="Update method">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => {
              setMode(m.id);
              setError(null);
            }}
            className={`rounded-md px-2 py-2 text-label-caps transition-colors ${
              mode === m.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "correction" && (
        <p className="rounded-lg border-l-4 border-l-gold bg-gold-soft p-3 text-sm text-foreground">
          Corrections fix a wrong earlier entry. The original history is kept — nothing is silently overwritten.
        </p>
      )}

      <FormField
        label={mode === "trip" ? "Trip distance (mi)" : mode === "correction" ? "Corrected odometer reading" : "New odometer reading"}
        inputMode="numeric"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError(null);
        }}
        placeholder={mode === "trip" ? "e.g. 50" : String(bike.mileage)}
        autoFocus
      />

      {mode === "correction" && (
        <TextAreaField
          label="What went wrong?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Misread the odometer last week"
        />
      )}

      {hasValue && (
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-inset p-3 text-center">
          <div>
            <dt className="text-label-caps text-secondary">Previous</dt>
            <dd className="mt-0.5 text-data-md">{formatNumber(bike.mileage)}</dd>
          </div>
          <div>
            <dt className="text-label-caps text-secondary">{mode === "trip" ? "Trip" : "New"}</dt>
            <dd className="mt-0.5 text-data-md">{mode === "trip" ? `+${formatNumber(Math.round(parsed))}` : formatNumber(newReading)}</dd>
          </div>
          <div>
            <dt className="text-label-caps text-secondary">{mode === "trip" ? "New total" : "Difference"}</dt>
            <dd className="mt-0.5 text-data-md font-bold">
              {mode === "trip" ? formatNumber(newReading) : `${difference >= 0 ? "+" : ""}${formatNumber(difference)}`}
            </dd>
          </div>
        </dl>
      )}

      {(error ?? liveError) && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold text-primary">{error ?? liveError}</p>
          {(error ?? liveError)?.includes("correction") && mode !== "correction" && (
            <button type="button" onClick={() => { setMode("correction"); setError(null); }} className="self-start text-label-caps text-primary hover:underline">
              Switch to a correction
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <TButton type="button" variant="secondary" onClick={onDone}>
          Cancel
        </TButton>
        <TButton type="submit" variant="primary" disabled={!hasValue || Boolean(liveError)}>
          <Icon name="speed" className="text-[18px]" /> Save reading
        </TButton>
      </div>
    </form>
  );
}
