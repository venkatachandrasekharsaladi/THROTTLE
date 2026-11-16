import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppHeader, PageBody } from "@/components/throttle/app-header";
import { TButton } from "@/components/throttle/button";
import { FuelStationCard } from "@/components/throttle/cards";
import { ConfirmDialog, Modal } from "@/components/throttle/dialogs";
import { SearchField } from "@/components/throttle/form-field";
import { FuelForm } from "@/components/throttle/garage-forms";
import { Icon } from "@/components/throttle/icon";
import { SectionLabel } from "@/components/throttle/section-card";
import { EmptyState } from "@/components/throttle/states";
import { DemoBadge } from "@/components/throttle/status-indicator";
import { fuelStations } from "@/data/demo";
import { useGarage } from "@/hooks/use-garage";
import { useLocalStorage, useStoredSet } from "@/hooks/use-local-storage";
import { formatDate, formatGbp, formatNumber, formatPence } from "@/lib/format";
import { fuelStats, monthlySpend, pricePerLitrePence } from "@/lib/fuel";
import { cn } from "@/lib/utils";
import type { FuelFilter, FuelRecord, FuelStation } from "@/types";

const FILTERS: { id: FuelFilter; label: string; icon: string }[] = [
  { id: "e5", label: "Under 160p E5", icon: "local_fire_department" },
  { id: "open24", label: "Open 24h", icon: "schedule" },
  { id: "bikeParking", label: "Bike parking", icon: "two_wheeler" },
];

const DISTANCE_OPTIONS = [
  { value: "0", label: "Any distance" },
  { value: "1", label: "Within 1 mi" },
  { value: "2", label: "Within 2 mi" },
  { value: "5", label: "Within 5 mi" },
];

export function directionsUrl(station: FuelStation): string {
  const q = `${station.brand} ${station.name} ${station.area} ${station.postcode}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function filterStations(
  stations: FuelStation[],
  query: string,
  filters: FuelFilter[],
  opts: { brand?: string | undefined; maxMiles?: number | undefined; favouritesOnly?: boolean; favourites?: string[] } = {},
) {
  const q = query.trim().toLowerCase();
  return stations
    .filter((s) => !q || `${s.brand} ${s.name} ${s.area} ${s.postcode}`.toLowerCase().includes(q))
    .filter((s) => !filters.includes("e5") || s.e5PricePence < 160)
    .filter((s) => !filters.includes("open24") || s.open24)
    .filter((s) => !filters.includes("bikeParking") || s.bikeParking)
    .filter((s) => !opts.brand || s.brand === opts.brand)
    .filter((s) => !opts.maxMiles || s.distanceMiles <= opts.maxMiles)
    .filter((s) => !opts.favouritesOnly || (opts.favourites ?? []).includes(s.id))
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

export function FuelPage() {
  const [tab, setTab] = useLocalStorage<"find" | "mine">("fuel-tab", "find");
  return (
    <>
      <AppHeader title="Fuel & Map" />
      <PageBody>
        <div role="tablist" aria-label="Fuel sections" className="grid grid-cols-2 gap-1 rounded-lg bg-elevated p-1">
          {(
            [
              { id: "find", label: "Find petrol", icon: "map" },
              { id: "mine", label: "My fuel", icon: "local_gas_station" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex h-9 items-center justify-center gap-1.5 rounded-md text-label-caps transition-all",
                tab === t.id ? "bg-background text-primary shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon name={t.icon} /> {t.label}
            </button>
          ))}
        </div>
        {tab === "find" ? <StationFinder /> : <MyFuel />}
      </PageBody>
    </>
  );
}

/* ---------- Station finder (demo data) ---------- */

function StationFinder() {
  const [view, setView] = useLocalStorage<"map" | "list">("fuel-view", "map");
  const [filters, setFilters] = useLocalStorage<FuelFilter[]>("fuel-filters", []);
  const [favourites, toggleFavourite] = useStoredSet("fuel-favourites");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [maxMiles, setMaxMiles] = useState("0");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(fuelStations[0]!.id);

  const brands = useMemo(() => [...new Set(fuelStations.map((s) => s.brand))].sort(), []);
  const results = useMemo(
    () =>
      filterStations(fuelStations, query, filters, {
        brand: brand || undefined,
        maxMiles: Number(maxMiles) || undefined,
        favouritesOnly,
        favourites,
      }),
    [query, filters, brand, maxMiles, favouritesOnly, favourites],
  );
  const cheapestId = useMemo(
    () => [...results].sort((a, b) => a.e5PricePence - b.e5PricePence)[0]?.id,
    [results],
  );
  const selected = results.find((s) => s.id === selectedId) ?? results[0];

  const toggleFilter = (id: FuelFilter) =>
    setFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  const clearAll = () => {
    setFilters([]);
    setQuery("");
    setBrand("");
    setMaxMiles("0");
    setFavouritesOnly(false);
  };

  return (
    <>
      <SearchField
        label="Search petrol stations"
        placeholder="Search stations, areas or postcodes"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <LabeledSelect label="Brand" value={brand} onChange={setBrand} options={[{ value: "", label: "All brands" }, ...brands.map((b) => ({ value: b, label: b }))]} />
        <LabeledSelect label="Distance" value={maxMiles} onChange={setMaxMiles} options={DISTANCE_OPTIONS} />
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => {
          const on = filters.includes(f.id);
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggleFilter(f.id)}
              className={cn(
                "flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-label-caps transition-colors",
                on ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-card hover:bg-elevated",
              )}
            >
              <Icon name={f.icon} className="text-[18px]" /> {f.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={favouritesOnly}
          onClick={() => setFavouritesOnly((v) => !v)}
          className={cn(
            "flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-label-caps transition-colors",
            favouritesOnly ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-card hover:bg-elevated",
          )}
        >
          <Icon name="favorite" className="text-[18px]" /> Favourites
        </button>
      </div>

      <div role="tablist" aria-label="View" className="grid grid-cols-2 gap-1 rounded-lg bg-elevated p-1">
        {(["map", "list"] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn(
              "flex h-9 items-center justify-center gap-1.5 rounded-md text-label-caps transition-all",
              view === v ? "bg-background text-primary shadow-soft" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon name={v === "map" ? "map" : "list"} /> {v}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon="local_gas_station"
          title="No stations match"
          description="Try clearing a filter or searching another London area."
          action={
            <TButton variant="secondary" size="sm" onClick={clearAll}>
              Clear filters
            </TButton>
          }
        />
      ) : view === "map" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <StationMap stations={results} selectedId={selected?.id} onSelect={setSelectedId} />
          <div className="lg:col-span-2">
            {selected && (
              <StationDetail
                station={selected}
                recommended={selected.id === cheapestId}
                favourite={favourites.includes(selected.id)}
                onToggleFavourite={() => toggleFavourite(selected.id)}
              />
            )}
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {results.map((s) => (
            <li key={s.id}>
              <FuelStationCard
                station={s}
                recommended={s.id === cheapestId}
                selected={s.id === selected?.id}
                favourite={favourites.includes(s.id)}
                onToggleFavourite={() => toggleFavourite(s.id)}
                onSelect={() => {
                  setSelectedId(s.id);
                  setView("map");
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function StationDetail({
  station,
  recommended,
  favourite,
  onToggleFavourite,
}: {
  station: FuelStation;
  recommended?: boolean;
  favourite: boolean;
  onToggleFavourite: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <FuelStationCard
        station={station}
        selected
        recommended={recommended}
        favourite={favourite}
        onToggleFavourite={onToggleFavourite}
      />
      <section aria-label="Station details" className="hairline-card p-4">
        <SectionLabel>Station details</SectionLabel>
        <p className="mt-2 text-sm text-muted-foreground">
          {station.area}, {station.postcode} · updated {station.updatedLabel}
        </p>
        {station.amenities.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {station.amenities.map((a) => (
              <li key={a} className="rounded-sm bg-inset px-2 py-1 text-mono-badge text-secondary">
                {a}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={directionsUrl(station)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-label-caps text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Icon name="directions" className="text-[18px]" /> Directions
          </a>
          <DemoBadge />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Sample station — prices are demonstration data, not live prices.
        </p>
      </section>
    </div>
  );
}

/** Illustrative, offline map of central/south-west London. Not a live map. */
function StationMap({
  stations,
  selectedId,
  onSelect,
}: {
  stations: FuelStation[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="hairline-card relative aspect-[4/3] overflow-hidden lg:col-span-3">
      <svg viewBox="0 0 100 75" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect width="100" height="75" className="fill-map-land" />
        <ellipse cx="28" cy="62" rx="9" ry="5" className="fill-map-park" />
        <ellipse cx="22" cy="22" rx="12" ry="6" className="fill-map-park" />
        <path d="M0 50 C 15 46, 22 58, 38 52 S 60 40, 72 48 S 90 60, 100 52 L100 57 C 90 65, 75 52, 68 54 S 45 60, 38 58 S 15 52, 0 56 Z" className="fill-map-water" />
        {["M0 30 L100 38", "M10 0 L35 75", "M55 0 L60 75", "M0 68 L100 62", "M80 0 L70 75", "M0 15 L100 20"].map((d) => (
          <path key={d} d={d} className="stroke-map-road" strokeWidth="1.6" fill="none" />
        ))}
      </svg>
      <span className="absolute left-3 top-3 rounded-sm bg-background/90 px-2 py-1 text-mono-badge">Central London · illustrative</span>
      <span className="absolute left-[50%] top-[62%] flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-secondary ring-4 ring-secondary/25" aria-label="Your sample location" />
      {stations.map((s) => {
        const active = s.id === selectedId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            aria-pressed={active}
            aria-label={`${s.brand} ${s.name}, E5 ${formatPence(s.e5PricePence)}`}
            style={{ left: `${s.mapX}%`, top: `${s.mapY}%` }}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border px-2 py-1 text-mono-badge transition-transform",
              active
                ? "z-10 scale-110 border-primary bg-primary text-primary-foreground race-plate"
                : "border-border bg-background text-foreground hover:scale-105",
            )}
          >
            {s.brand} {formatPence(s.e5PricePence)}
          </button>
        );
      })}
      <p className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-md bg-navy/90 px-3 py-2 text-mono-badge text-navy-foreground">
        <Icon name="info" className="text-[16px] text-gold" /> Demo data · sample stations and prices
      </p>
    </div>
  );
}

/* ---------- My fuel (analytics dashboard) ---------- */

function MyFuel() {
  const garage = useGarage();
  const { active } = garage;
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<FuelRecord | null>(null);
  const [deleting, setDeleting] = useState<FuelRecord | null>(null);

  const stats = useMemo(() => fuelStats(active.fuelRecords), [active.fuelRecords]);
  const months = useMemo(() => monthlySpend(active.fuelRecords), [active.fuelRecords]);
  const maxMonth = Math.max(...months.map((m) => m.totalGbp), 1);
  const history = useMemo(
    () => [...active.fuelRecords].sort((a, b) => b.date.localeCompare(a.date)),
    [active.fuelRecords],
  );

  const saveNew = (record: FuelRecord) => {
    garage.addFuelRecord(active.bike.id, record);
    if (record.mileage > active.bike.mileage) {
      const error = garage.updateMileage(active.bike.id, record.mileage, "Manual", "Logged with fuel purchase");
      if (error) toast.error(error);
      else toast.success(`Fuel logged — odometer updated to ${formatNumber(record.mileage)} mi`);
    } else {
      toast.success("Fuel logged");
    }
    setLogOpen(false);
  };

  return (
    <>
      {garage.state.bikes.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Choose bike">
          {garage.state.bikes.map((g) => (
            <button
              key={g.bike.id}
              role="tab"
              aria-selected={g.bike.id === active.bike.id}
              onClick={() => garage.setActive(g.bike.id)}
              className={cn(
                "flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-label-caps transition-colors",
                g.bike.id === active.bike.id
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-card hover:bg-elevated",
              )}
            >
              <Icon name="two_wheeler" className="text-[18px]" /> {g.bike.nickname}
            </button>
          ))}
        </div>
      )}

      {history.length === 0 ? (
        <EmptyState
          icon="local_gas_station"
          title="No fuel logged yet"
          description={`Log your first fill-up for ${active.bike.nickname} to see MPG and spend here.`}
          action={
            <TButton size="sm" onClick={() => setLogOpen(true)}>
              <Icon name="add" className="text-[18px]" /> Log fuel
            </TButton>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total spend" value={formatGbp(stats.totalSpendGbp)} icon="payments" />
            <StatCard label="Total litres" value={`${stats.totalLitres.toFixed(1)} L`} icon="local_gas_station" />
            <StatCard
              label="Average MPG"
              value={stats.averageMpg != null ? stats.averageMpg.toFixed(1) : "—"}
              icon="speed"
              hint={stats.averageMpg != null ? "Full-to-full" : "Needs 2 full-tank fills"}
            />
            <StatCard
              label="Last fill-up"
              value={stats.lastFillDate ? formatDate(stats.lastFillDate) : "—"}
              icon="event"
            />
          </div>

          <section aria-label="Monthly expenditure" className="hairline-card p-4">
            <SectionLabel>Monthly expenditure</SectionLabel>
            <div className="mt-3 flex h-32 items-end gap-2">
              {months.map((m) => (
                <div key={m.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-mono-badge text-muted-foreground">
                    {m.totalGbp > 0 ? `£${m.totalGbp.toFixed(0)}` : ""}
                  </span>
                  <div
                    className={cn("w-full max-w-10 rounded-t-sm", m.totalGbp > 0 ? "bg-primary" : "bg-inset")}
                    style={{ height: `${Math.max(4, (m.totalGbp / maxMonth) * 88)}px` }}
                    role="img"
                    aria-label={`${m.label}: ${formatGbp(m.totalGbp)}`}
                  />
                  <span className="text-mono-badge text-secondary">{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel
              action={
                <TButton variant="secondary" size="sm" onClick={() => setLogOpen(true)}>
                  <Icon name="add" className="text-[18px]" /> Log fuel
                </TButton>
              }
            >
              Fuel history · {active.bike.nickname}
            </SectionLabel>
            <ul className="flex flex-col gap-2">
              {history.map((r) => (
                <FuelHistoryRow key={r.id} record={r} onEdit={() => setEditing(r)} onDelete={() => setDeleting(r)} />
              ))}
            </ul>
          </section>
        </>
      )}

      <Modal open={logOpen} onOpenChange={setLogOpen} title={`Log fuel · ${active.bike.nickname}`}>
        <FuelForm defaultMileage={active.bike.mileage} onSubmit={saveNew} onCancel={() => setLogOpen(false)} />
      </Modal>

      <Modal open={editing != null} onOpenChange={(open) => !open && setEditing(null)} title="Edit fuel record">
        {editing && (
          <FuelForm
            initial={editing}
            defaultMileage={active.bike.mileage}
            onSubmit={(record) => {
              garage.updateFuelRecord(active.bike.id, record);
              toast.success("Fuel record updated");
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete fuel record?"
        description={
          deleting
            ? `Remove the ${formatDate(deleting.date)} fill-up of ${deleting.litres.toFixed(1)} L (${formatGbp(deleting.costGbp)}). This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) garage.deleteFuelRecord(active.bike.id, deleting.id);
          setDeleting(null);
        }}
      />
    </>
  );
}

function StatCard({ label, value, icon, hint }: { label: string; value: string; icon: string; hint?: string }) {
  return (
    <div className="hairline-card p-3">
      <p className="flex items-center gap-1.5 text-label-caps text-secondary">
        <Icon name={icon} className="text-[16px] text-primary" /> {label}
      </p>
      <p className="mt-1 truncate text-data-lg">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FuelHistoryRow({
  record,
  onEdit,
  onDelete,
}: {
  record: FuelRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ppl = pricePerLitrePence(record);
  return (
    <li className="hairline-card flex items-center gap-3 p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-inset text-primary">
        <Icon name="local_gas_station" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-headline-sm">
          {record.station ?? "Fuel"} · {formatGbp(record.costGbp)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(record.date)} · {record.litres.toFixed(1)} L
          {ppl != null ? ` · ${formatPence(ppl)}/L` : ""} · {formatNumber(record.mileage)} mi
          {record.fullTank ? " · Full tank" : " · Partial"}
        </p>
        {record.notes && <p className="text-xs text-muted-foreground">{record.notes}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <TButton variant="ghost" size="sm" onClick={onEdit} aria-label="Edit fuel record">
          <Icon name="edit" className="text-[18px]" />
        </TButton>
        <TButton variant="ghost" size="sm" onClick={onDelete} aria-label="Delete fuel record">
          <Icon name="delete" className="text-[18px]" />
        </TButton>
      </div>
    </li>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label-caps text-secondary">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-border bg-inset px-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

