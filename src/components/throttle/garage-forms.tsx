import { useState, type FormEvent, type ReactNode } from "react";
import { newId, todayISO } from "@/lib/garage";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_TYPES,
  MAINTENANCE_CATEGORIES,
  type BikeDocument,
  type CompletedTask,
  type DocumentType,
  type FuelRecord,
  type MaintenanceCategory,
  type MaintenanceTask,
  type Motorcycle,
  type ServiceRecord,
} from "@/types";
import { TButton } from "./button";
import { FormField, TextAreaField } from "./form-field";

interface Errors {
  nickname?: string;
  make?: string;
  model?: string;
  year?: string;
  engineCc?: string;
  mileage?: string;
  purchasePrice?: string;
  name?: string;
  dueMileage?: string;
  date?: string;
  cost?: string;
  title?: string;
  litres?: string;
}

function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="text-xs font-bold text-primary">{children}</p>;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-caps text-secondary">
        {label}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-lg border border-border bg-inset px-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

function FormActions({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
  return (
    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <TButton type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </TButton>
      <TButton type="submit" variant="primary">
        {submitLabel}
      </TButton>
    </div>
  );
}

/* ---------- Motorcycle ---------- */

export function BikeForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Motorcycle;
  onSubmit: (bike: Motorcycle) => void;
  onCancel: () => void;
}) {
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState(initial?.year ? String(initial.year) : "");
  const [engineCc, setEngineCc] = useState(initial?.engineCc ? String(initial.engineCc) : "");
  const [registration, setRegistration] = useState(initial?.registration ?? "");
  const [mileage, setMileage] = useState(initial ? String(initial.mileage) : "");
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? "");
  const [purchasePrice, setPurchasePrice] = useState(initial?.purchasePriceGbp != null ? String(initial.purchasePriceGbp) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    const yearNum = Number(year);
    const ccNum = Number(engineCc);
    const mileageNum = Number(mileage);
    if (!nickname.trim()) next.nickname = "Give your bike a nickname.";
    if (!make.trim()) next.make = "Enter the make, e.g. Yamaha.";
    if (!model.trim()) next.model = "Enter the model, e.g. MT-07.";
    if (!year || !Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) next.year = "Enter a valid year.";
    if (!engineCc || !Number.isFinite(ccNum) || ccNum <= 0) next.engineCc = "Enter the engine size in cc.";
    if (mileage === "" || !Number.isFinite(mileageNum) || mileageNum < 0) next.mileage = "Enter the current mileage.";
    if (purchasePrice && (!Number.isFinite(Number(purchasePrice)) || Number(purchasePrice) < 0)) next.purchasePrice = "Enter a valid price.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      id: initial?.id ?? newId(),
      nickname: nickname.trim(),
      make: make.trim(),
      model: model.trim(),
      year: yearNum,
      engineCc: ccNum,
      mileage: Math.round(mileageNum),
      registration: registration.trim() || undefined,
      purchaseDate: purchaseDate || undefined,
      purchasePriceGbp: purchasePrice ? Number(purchasePrice) : undefined,
      notes: notes.trim() || undefined,
      image: initial?.image,
      engineType: initial?.engineType,
      power: initial?.power,
      kerbWeightKg: initial?.kerbWeightKg,
      colour: initial?.colour,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <FormField label="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Shadow" />
      <ErrorText>{errors.nickname}</ErrorText>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FormField label="Make" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Yamaha" />
          <ErrorText>{errors.make}</ErrorText>
        </div>
        <div>
          <FormField label="Model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="MT-07" />
          <ErrorText>{errors.model}</ErrorText>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FormField label="Year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2022" />
          <ErrorText>{errors.year}</ErrorText>
        </div>
        <div>
          <FormField label="Engine (cc)" inputMode="numeric" value={engineCc} onChange={(e) => setEngineCc(e.target.value)} placeholder="689" />
          <ErrorText>{errors.engineCc}</ErrorText>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Registration (optional)" value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="LK22 MTO" />
        <div>
          {initial ? (
            <FormField
              label="Mileage (mi)"
              value={mileage}
              readOnly
              disabled
              hint="Odometer changes go through Update mileage, so every change is recorded."
            />
          ) : (
            <>
              <FormField label="Mileage (mi)" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="12450" />
              <ErrorText>{errors.mileage}</ErrorText>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Purchase date (optional)" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        <div>
          <FormField label="Purchase price £ (optional)" inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="6500" />
          <ErrorText>{errors.purchasePrice}</ErrorText>
        </div>
      </div>
      <TextAreaField label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering…" />
      <FormActions onCancel={onCancel} submitLabel={initial ? "Save changes" : "Add motorcycle"} />
    </form>
  );
}

/* ---------- Maintenance task ---------- */

export function TaskForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: MaintenanceTask;
  onSubmit: (task: MaintenanceTask) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<MaintenanceCategory>(initial?.category ?? "Engine oil");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [dueMileage, setDueMileage] = useState(initial?.dueMileage != null ? String(initial.dueMileage) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Give the task a name.";
    if (dueMileage && (!Number.isFinite(Number(dueMileage)) || Number(dueMileage) < 0)) next.dueMileage = "Enter a valid mileage.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      id: initial?.id ?? newId(),
      name: name.trim(),
      category,
      description: description.trim(),
      dueDate: dueDate || undefined,
      dueMileage: dueMileage ? Math.round(Number(dueMileage)) : undefined,
      notes: notes.trim() || undefined,
      lastCompletedDate: initial?.lastCompletedDate,
      lastCompletedMileage: initial?.lastCompletedMileage,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div>
        <FormField label="Task name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chain clean & adjust" />
        <ErrorText>{errors.name}</ErrorText>
      </div>
      <SelectField label="Category" value={category} onChange={(v) => setCategory(v as MaintenanceCategory)} options={MAINTENANCE_CATEGORIES} />
      <TextAreaField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs doing…" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Due date (optional)" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <div>
          <FormField label="Due mileage (optional)" inputMode="numeric" value={dueMileage} onChange={(e) => setDueMileage(e.target.value)} placeholder="16000" />
          <ErrorText>{errors.dueMileage}</ErrorText>
        </div>
      </div>
      <TextAreaField label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <p className="text-xs text-muted-foreground">Intervals are your own reminders, not manufacturer recommendations.</p>
      <FormActions onCancel={onCancel} submitLabel={initial ? "Save changes" : "Add task"} />
    </form>
  );
}

/* ---------- Complete task ---------- */

export function CompleteTaskForm({
  task,
  bikeMileage,
  onSubmit,
  onCancel,
}: {
  task: MaintenanceTask;
  bikeMileage: number;
  onSubmit: (record: Pick<CompletedTask, "completedDate" | "completedMileage" | "costGbp" | "completionNotes">) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [mileage, setMileage] = useState(String(bikeMileage));
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!date) next.date = "Pick the completion date.";
    if (mileage === "" || !Number.isFinite(Number(mileage)) || Number(mileage) < 0) next.mileage = "Enter the current mileage.";
    if (cost && (!Number.isFinite(Number(cost)) || Number(cost) < 0)) next.cost = "Enter a valid cost.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      completedDate: date,
      completedMileage: Math.round(Number(mileage)),
      costGbp: cost ? Number(cost) : undefined,
      completionNotes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <p className="text-sm text-muted-foreground">
        Completing <span className="font-bold text-foreground">{task.name}</span> moves it to Completed and records the cost.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FormField label="Completion date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <ErrorText>{errors.date}</ErrorText>
        </div>
        <div>
          <FormField label="Mileage" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} />
          <ErrorText>{errors.mileage}</ErrorText>
        </div>
      </div>
      <div>
        <FormField label="Cost £ (optional)" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
        <ErrorText>{errors.cost}</ErrorText>
      </div>
      <TextAreaField label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <FormActions onCancel={onCancel} submitLabel="Mark as complete" />
    </form>
  );
}

/* ---------- Service record ---------- */

export function ServiceForm({
  initial,
  defaultMileage,
  onSubmit,
  onCancel,
}: {
  initial?: ServiceRecord;
  defaultMileage: number;
  onSubmit: (record: ServiceRecord) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [mileage, setMileage] = useState(initial ? String(initial.mileage) : String(defaultMileage));
  const [workshop, setWorkshop] = useState(initial?.workshop ?? "");
  const [cost, setCost] = useState(initial ? String(initial.costGbp) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [receiptName, setReceiptName] = useState(initial?.receiptName ?? "");
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!title.trim()) next.title = "Give the service a title.";
    if (!date) next.date = "Pick the service date.";
    if (mileage === "" || !Number.isFinite(Number(mileage)) || Number(mileage) < 0) next.mileage = "Enter the mileage at service.";
    if (cost === "" || !Number.isFinite(Number(cost)) || Number(cost) < 0) next.cost = "Enter the cost in pounds.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      id: initial?.id ?? newId(),
      title: title.trim(),
      date,
      mileage: Math.round(Number(mileage)),
      costGbp: Number(cost),
      workshop: workshop.trim() || undefined,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      receiptName: receiptName.trim() || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div>
        <FormField label="Service title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual service" />
        <ErrorText>{errors.title}</ErrorText>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FormField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <ErrorText>{errors.date}</ErrorText>
        </div>
        <div>
          <FormField label="Mileage" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} />
          <ErrorText>{errors.mileage}</ErrorText>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Garage (optional)" value={workshop} onChange={(e) => setWorkshop(e.target.value)} placeholder="Thames Moto Workshop" />
        <div>
          <FormField label="Cost £" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="165.00" />
          <ErrorText>{errors.cost}</ErrorText>
        </div>
      </div>
      <TextAreaField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <TextAreaField label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <FormField label="Receipt filename (optional)" value={receiptName} onChange={(e) => setReceiptName(e.target.value)} placeholder="receipt-sept.pdf" hint="Stored as a name only — no file is uploaded." />
      <FormActions onCancel={onCancel} submitLabel={initial ? "Save changes" : "Add record"} />
    </form>
  );
}

/* ---------- Document ---------- */

export function DocumentForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: BikeDocument;
  onSubmit: (doc: BikeDocument) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<DocumentType>(initial?.type ?? "MOT certificate");
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? "");
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [fileName, setFileName] = useState(initial?.fileName ?? "");
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!title.trim()) next.title = "Give the document a name.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      id: initial?.id ?? newId(),
      title: title.trim(),
      type,
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      notes: notes.trim() || undefined,
      fileName: fileName.trim() || undefined,
      detail: initial?.detail,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div>
        <FormField label="Document name" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. MOT certificate" />
        <ErrorText>{errors.title}</ErrorText>
      </div>
      <SelectField label="Type" value={type} onChange={(v) => setType(v as DocumentType)} options={DOCUMENT_TYPES} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Issue date (optional)" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        <FormField label="Expiry date (optional)" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
      </div>
      <TextAreaField label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <FormField label="Filename (optional)" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="mot-2026.pdf" hint="Stored as a name only — no file is uploaded." />
      <FormActions onCancel={onCancel} submitLabel={initial ? "Save changes" : "Add document"} />
    </form>
  );
}

/* ---------- Fuel record ---------- */

export function FuelForm({
  initial,
  defaultMileage,
  onSubmit,
  onCancel,
}: {
  initial?: FuelRecord;
  /** Current odometer — prefilled unless recording an older fill-up. */
  defaultMileage: number;
  onSubmit: (record: FuelRecord) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [litres, setLitres] = useState(initial ? String(initial.litres) : "");
  const [cost, setCost] = useState(initial ? String(initial.costGbp) : "");
  const [mileage, setMileage] = useState(initial ? String(initial.mileage) : String(defaultMileage));
  const [fullTank, setFullTank] = useState(initial?.fullTank ?? true);
  const [station, setStation] = useState(initial?.station ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Errors>({});

  const litresNum = Number(litres);
  const costNum = Number(cost);
  const ppl = litres !== "" && cost !== "" && litresNum > 0 && Number.isFinite(costNum) ? (costNum / litresNum) * 100 : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!date) next.date = "Pick the fill-up date.";
    if (litres === "" || !Number.isFinite(Number(litres)) || Number(litres) <= 0) next.litres = "Enter the litres filled.";
    if (cost === "" || !Number.isFinite(Number(cost)) || Number(cost) < 0) next.cost = "Enter the cost in pounds.";
    if (mileage === "" || !Number.isFinite(Number(mileage)) || Number(mileage) <= 0) next.mileage = "Enter the mileage at fill-up.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      id: initial?.id ?? newId(),
      date,
      litres: Number(litres),
      costGbp: Number(cost),
      mileage: Math.round(Number(mileage)),
      fullTank,
      station: station.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FormField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <ErrorText>{errors.date}</ErrorText>
        </div>
        <div>
          <FormField
            label="Mileage"
            inputMode="numeric"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            {...(initial ? {} : { hint: "Prefilled with the current odometer — change it only for an older fill-up." })}
          />
          <ErrorText>{errors.mileage}</ErrorText>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FormField label="Litres" inputMode="decimal" value={litres} onChange={(e) => setLitres(e.target.value)} placeholder="11.8" />
          <ErrorText>{errors.litres}</ErrorText>
        </div>
        <div>
          <FormField label="Cost £" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="18.53" />
          <ErrorText>{errors.cost}</ErrorText>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-inset px-3 py-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fullTank}
            onChange={(e) => setFullTank(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Full tank
        </label>
        <p className="text-mono-badge text-muted-foreground">
          {ppl != null ? `${ppl.toFixed(1)}p per litre` : "Price per litre appears as you type"}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Full-tank fill-ups are used for the full-to-full MPG calculation; partial fills still count towards spend.
      </p>
      <FormField label="Station (optional)" value={station} onChange={(e) => setStation(e.target.value)} placeholder="Esso · Vauxhall Bridge Road" />
      <TextAreaField label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <FormActions onCancel={onCancel} submitLabel={initial ? "Save changes" : "Log fuel"} />
    </form>
  );
}

export { cn };
