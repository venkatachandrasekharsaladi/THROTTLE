import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatMiles, formatPence } from "@/lib/format";
import type { CommunityPost, FuelStation, MaintenanceItem, Motorcycle, RideEvent } from "@/types";
import { Icon } from "./icon";
import { TButton } from "./button";
import { DemoBadge, StatusIndicator } from "./status-indicator";

/* ---------- Motorcycle image card ---------- */
export function MotorcycleCard({
  bike,
  badge,
  footer,
  priority,
}: {
  bike: Motorcycle;
  badge?: ReactNode;
  footer?: ReactNode;
  priority?: boolean;
}) {
  return (
    <article className="hairline-card overflow-hidden">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-elevated md:aspect-[21/9]">
        {bike.image ? (
          <img
            src={bike.image}
            alt={`${bike.year} ${bike.make} ${bike.model} “${bike.nickname}”`}
            width={1280}
            height={800}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-navy">
            <Icon name="two_wheeler" className="text-[64px] text-gold" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/10 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-background/90 px-2 py-1 text-mono-badge text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Active bike
          </span>
        </div>
        {badge && <div className="absolute right-3 top-3">{badge}</div>}
        <div className="absolute inset-x-4 bottom-3 text-navy-foreground">
          <p className="text-mono-badge text-gold">
            {bike.year} {bike.make} {bike.model} · {bike.engineCc}cc
          </p>
          <h2 className="text-hero">“{bike.nickname}”</h2>
        </div>
      </div>
      {footer && <div className="p-4">{footer}</div>}
    </article>
  );
}

/* ---------- Maintenance reminder ---------- */
export function MaintenanceReminder({
  item,
  done,
  onLogDone,
  onView,
}: {
  item: MaintenanceItem;
  done?: boolean;
  onLogDone?: () => void;
  onView?: () => void;
}) {
  return (
    <section
      aria-label="Upcoming maintenance"
      className={cn(
        "hairline-card relative overflow-hidden border-l-4 p-4",
        done ? "border-l-success" : item.status === "urgent" ? "border-l-primary" : "border-l-gold",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold-foreground">
            <Icon name={done ? "task_alt" : "build"} />
          </span>
          <div>
            <p className="text-label-caps text-secondary">Upcoming maintenance</p>
            <h3 className="text-headline-md">{item.title}</h3>
          </div>
        </div>
        {done ? (
          <StatusIndicator status="good" label="Logged" />
        ) : (
          <StatusIndicator status={item.status} label={item.dueLabel} />
        )}
      </div>
      <p className="mt-3 text-muted-foreground">{item.detail}</p>
      {(onView || onLogDone) && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          {onView && (
            <TButton variant="dark" className="flex-1" onClick={onView}>
              View maintenance <Icon name="arrow_forward" />
            </TButton>
          )}
          {onLogDone && !done && (
            <TButton variant="secondary" onClick={onLogDone}>
              Log done
            </TButton>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------- Fuel station card ---------- */
export function FuelStationCard({
  station,
  selected,
  onSelect,
  recommended,
  favourite,
  onToggleFavourite,
}: {
  station: FuelStation;
  selected?: boolean | undefined;
  onSelect?: (() => void) | undefined;
  recommended?: boolean | undefined;
  favourite?: boolean | undefined;
  onToggleFavourite?: (() => void) | undefined;
}) {
  return (
    <article
      className={cn(
        "hairline-card p-4 transition-shadow",
        selected && "race-plate border-secondary",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {recommended && <StatusIndicator status="urgent" label="Cheapest E5" />}
            <DemoBadge />
          </div>
          <h3 className="text-headline-md">
            {station.brand} · {station.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {station.area}, {station.postcode}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          {onToggleFavourite && (
            <TButton
              variant="ghost"
              size="sm"
              onClick={onToggleFavourite}
              aria-pressed={favourite}
              aria-label={favourite ? "Remove from favourites" : "Save as favourite"}
            >
              <Icon name={favourite ? "favorite" : "favorite_border"} className={cn("text-[20px]", favourite && "text-primary")} />
            </TButton>
          )}
          <div className="text-right">
            <p className="text-data-lg">{station.distanceMiles.toFixed(1)}</p>
            <p className="text-mono-badge text-muted-foreground">mi</p>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PriceTile label="Super unleaded (E5)" pence={station.e5PricePence} highlight />
        <PriceTile label="Unleaded (E10)" pence={station.e10PricePence} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {station.open24 && <StatusIndicator status="info" label="Open 24h" />}
        {station.bikeParking && <StatusIndicator status="good" label="Bike parking" />}
        {onSelect && (
          <TButton variant="link" size="sm" className="ml-auto" onClick={onSelect} aria-pressed={selected}>
            {selected ? "Previewing" : "Preview"}
          </TButton>
        )}
      </div>
    </article>
  );
}

function PriceTile({ label, pence, highlight }: { label: string; pence: number; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-inset p-3">
      <p className="text-label-caps text-secondary">{label}</p>
      <p className={cn("mt-1 text-data-lg", highlight && "text-primary")}>
        {formatPence(pence)}
        <span className="text-data-md text-muted-foreground"> /L</span>
      </p>
    </div>
  );
}

/* ---------- Community post card ---------- */
export function PostCard({
  post,
  liked,
  saved,
  onLike,
  onSave,
}: {
  post: CommunityPost;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
}) {
  const likes = post.likes + (liked ? 1 : 0);
  return (
    <article className="hairline-card overflow-hidden">
      <header className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-elevated font-display text-xl text-primary">
            {post.authorInitials}
          </span>
          <div className="min-w-0">
            <p className="font-bold">
              {post.authorName}{" "}
              <span className="text-mono-badge font-normal text-muted-foreground">· {post.timeLabel}</span>
            </p>
            <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
              <Icon name="two_wheeler" className="text-[16px] text-primary" /> {post.bike}
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1 rounded-sm bg-elevated px-2 py-1 text-mono-badge sm:inline-flex">
          <Icon name="location_on" className="text-[14px] text-primary" /> {post.location}
        </span>
      </header>
      {post.image && (
        <img
          src={post.image}
          alt={`${post.bike} — ${post.location}`}
          width={1280}
          height={800}
          loading="lazy"
          className="aspect-[16/10] w-full object-cover"
        />
      )}
      <p className="px-4 pt-3">{post.body}</p>
      <footer className="flex items-center gap-4 px-4 pb-3 pt-2 text-muted-foreground">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          aria-label={liked ? "Unlike post" : "Like post"}
          className={cn("flex h-10 items-center gap-1.5 hover:text-primary", liked && "text-primary")}
        >
          <Icon name="favorite" filled={liked} /> <span className="text-data-md">{likes}</span>
        </button>
        <span className="flex items-center gap-1.5">
          <Icon name="chat_bubble" /> <span className="text-data-md">{post.comments}</span>
        </span>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove bookmark" : "Bookmark post"}
          className={cn("ml-auto flex h-10 w-10 items-center justify-center hover:text-primary", saved && "text-primary")}
        >
          <Icon name="bookmark" filled={saved} />
        </button>
      </footer>
    </article>
  );
}

/* ---------- Ride event card ---------- */
export function RideEventCard({
  ride,
  going,
  onToggleGoing,
  compact,
}: {
  ride: RideEvent;
  going: boolean;
  onToggleGoing?: () => void;
  compact?: boolean;
}) {
  return (
    <article className="hairline-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold text-navy">
          <Icon name="sports_motorsports" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator status="due" label={ride.type} />
            <span className="text-mono-badge text-primary">{ride.dateLabel}</span>
          </div>
          <h3 className="mt-1 text-headline-md">{ride.title}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Icon name="location_on" className="text-[16px]" /> {ride.meetPoint} · {formatMiles(ride.distanceMiles)}
          </p>
        </div>
      </div>
      {!compact && <p className="mt-3 text-muted-foreground">{ride.description}</p>}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          <span className="text-data-md text-foreground">{ride.ridersConfirmed + (going ? 1 : 0)}</span> riders going
        </span>
        {onToggleGoing && (
          <TButton variant={going ? "outline" : "dark"} size="sm" onClick={onToggleGoing} aria-pressed={going}>
            {going ? (
              <>
                <Icon name="check_circle" className="text-[18px] text-success" /> You're going
              </>
            ) : (
              "RSVP"
            )}
          </TButton>
        )}
      </div>
    </article>
  );
}
