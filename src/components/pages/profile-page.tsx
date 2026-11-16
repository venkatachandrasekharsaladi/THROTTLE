import { Link } from "@tanstack/react-router";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppHeader, PageBody } from "@/components/throttle/app-header";
import { TButton } from "@/components/throttle/button";
import { ConfirmDialog, Modal } from "@/components/throttle/dialogs";
import { FormField, TextAreaField } from "@/components/throttle/form-field";
import { Icon } from "@/components/throttle/icon";
import { EmptyState } from "@/components/throttle/states";
import { DemoBadge } from "@/components/throttle/status-indicator";
import { rider } from "@/data/demo";
import { useGarage } from "@/hooks/use-garage";
import { useProfile } from "@/hooks/use-profile";
import { useSocial } from "@/hooks/use-social";
import { formatNumber } from "@/lib/format";
import { fuelStats } from "@/lib/fuel";
import { nextTask, taskDueLabel } from "@/lib/garage";
import { BIO_MAX, EXPERIENCE_OPTIONS, ridingStats, validateAvatar } from "@/lib/profile";
import { ME_ID, timeAgo } from "@/lib/social";
import { cn } from "@/lib/utils";
import type { ProfileSettings } from "@/types";

function Row({
  icon,
  iconClass,
  title,
  count,
  sub,
  open,
  onToggle,
  children,
}: {
  icon: string;
  iconClass?: string;
  title: string;
  count?: number;
  sub: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="hairline-card min-w-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 p-4 text-left">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-elevated", iconClass)}>
          <Icon name={icon} className="text-[24px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-headline-md">{title}</span>
            {count !== undefined && <span className="rounded-sm bg-elevated px-1.5 text-mono-badge text-secondary">{count}</span>}
          </span>
          <span className="block truncate text-muted-foreground">{sub}</span>
        </span>
        <Icon name="chevron_right" className={cn("transition-transform", open && "rotate-90")} />
      </button>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </section>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-sm bg-elevated px-2 py-1 text-mono-badge text-secondary">{children}</span>;
}

export function ProfilePage() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));
  const { state, updateProfile, setAvatar } = useProfile();
  const social = useSocial();
  const garage = useGarage();
  const fileInput = useRef<HTMLInputElement>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<ProfileSettings>(state.profile);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const { profile, privacy } = state;
  const stats = ridingStats(garage.state, social.state);
  const bikes = garage.state.bikes;
  const activeId = garage.state.activeId;
  const myPosts = social.state.posts.filter((p) => p.authorId === ME_ID);
  const myClubs = social.state.clubs.filter((c) => c.memberIds.includes(ME_ID));
  const myRides = social.state.rides.filter((r) => r.participantIds.includes(ME_ID));
  const avatarSrc = profile.avatarDataUrl ?? rider.avatar;

  const openEdit = () => {
    setDraft(state.profile);
    setEditOpen(true);
  };

  const saveEdit = () => {
    const error = updateProfile(draft);
    if (error) {
      toast.error(error);
      return;
    }
    setEditOpen(false);
    toast.success("Profile updated.");
  };

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    const error = validateAvatar(file);
    if (error) {
      toast.error(error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(typeof reader.result === "string" ? reader.result : undefined);
      toast.success("Profile photo updated.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <AppHeader
        title="Profile"
        actions={
          <Link to="/settings" aria-label="Settings" className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground">
            <Icon name="settings" className="text-[22px]" />
          </Link>
        }
      />
      <PageBody>
        {/* Rider card */}
        <section className="hairline-card p-4">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img src={avatarSrc} alt={profile.displayName} width={96} height={96} className="h-24 w-24 rounded-xl border-2 border-primary-soft object-cover" />
              <button
                type="button"
                aria-label="Change profile photo"
                onClick={() => fileInput.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft"
              >
                <Icon name="photo_camera" className="text-[16px]" />
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  pickPhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-headline-lg">{profile.displayName}</h2>
              <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
              {privacy.showLocation && profile.location && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <Icon name="location_on" className="text-[14px]" />
                  <span className="truncate">{profile.location}</span>
                </p>
              )}
              <p className="mt-0.5 text-sm text-muted-foreground">Member since {rider.memberSince}</p>
            </div>
          </div>
          {profile.bio && <p className="mt-3 text-[15px]">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip>{profile.experience}</Chip>
            {profile.interests.map((i) => (
              <Chip key={i}>{i}</Chip>
            ))}
            {profile.brands.map((b) => (
              <Chip key={b}>{b}</Chip>
            ))}
          </div>
          <dl className="mt-4 grid grid-cols-3 divide-x divide-border rounded-lg bg-inset py-3 text-center sm:grid-cols-6">
            {[
              ["Bikes", String(stats.bikeCount)],
              ["Miles", formatNumber(stats.totalMiles)],
              ["Posts", String(stats.postCount)],
              ["Followers", String(stats.followerCount)],
              ["Following", String(stats.followingCount)],
              ["Rides", String(stats.rideCount)],
            ].map(([k, v]) => (
              <div key={k} className="py-1">
                <dd className="text-data-lg">{v}</dd>
                <dt className="text-label-caps text-muted-foreground">{k}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex items-center justify-between gap-2">
            <DemoBadge />
            <div className="flex gap-2">
              {profile.avatarDataUrl && (
                <TButton variant="outline" onClick={() => setAvatar(undefined)}>
                  <Icon name="delete" /> Remove photo
                </TButton>
              )}
              <TButton variant="primary" onClick={openEdit}>
                <Icon name="edit" /> Edit profile
              </TButton>
            </div>
          </div>
          {!privacy.publicProfile && (
            <p className="mt-3 rounded-lg bg-inset p-3 text-sm text-muted-foreground">
              Your profile is marked private. Visibility rules are enforced once real accounts are connected.
            </p>
          )}
        </section>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Garage integration */}
          {privacy.showGarage && (
            <Row
              icon="two_wheeler"
              iconClass="text-primary"
              title="My garage"
              count={bikes.length}
              sub={bikes.map((g) => `“${g.bike.nickname}”`).join(", ")}
              open={open === "bikes"}
              onToggle={() => toggle("bikes")}
            >
              <ul className="flex flex-col gap-2">
                {bikes.map((g) => {
                  const fuel = fuelStats(g.fuelRecords);
                  const next = nextTask(g);
                  return (
                    <li key={g.bike.id}>
                      <Link to="/bike" className="block rounded-lg bg-inset p-3 hover:bg-elevated">
                        <span className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate font-bold">
                            {g.bike.year} {g.bike.make} {g.bike.model} “{g.bike.nickname}”
                          </span>
                          {g.bike.id === activeId && <span className="shrink-0 rounded-sm bg-primary px-1.5 py-0.5 text-mono-badge text-primary-foreground">Primary</span>}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {g.bike.engineCc}cc{g.bike.registration ? ` · ${g.bike.registration}` : ""} · {formatNumber(g.bike.mileage)} mi
                        </span>
                        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                          <span>{g.services.length} service{g.services.length === 1 ? "" : "s"}</span>
                          <span>{g.completed.length} task{g.completed.length === 1 ? "" : "s"} done</span>
                          <span>{fuel.averageMpg != null ? `${fuel.averageMpg.toFixed(1)} mpg` : "No MPG yet"}</span>
                          {next && <span className="text-primary">Next: {next.name} · {taskDueLabel(next, g.bike)}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Row>
          )}

          {/* Public posts */}
          {privacy.showPosts && (
            <Row
              icon="photo_library"
              iconClass="text-secondary"
              title="My posts"
              count={myPosts.length}
              sub={myPosts[0] ? `Latest ${timeAgo(myPosts[0].createdAt)}` : "Nothing posted yet"}
              open={open === "posts"}
              onToggle={() => toggle("posts")}
            >
              {myPosts.length ? (
                <ul className="flex flex-col gap-2">
                  {myPosts.map((p) => (
                    <li key={p.id} className="rounded-lg bg-inset p-3">
                      <p className="text-[15px]">{p.caption}</p>
                      <p className="mt-1 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>
                          {timeAgo(p.createdAt)} · {p.likedBy.length} like{p.likedBy.length === 1 ? "" : "s"} · {p.comments.length} comment{p.comments.length === 1 ? "" : "s"}
                        </span>
                        <button type="button" onClick={() => setDeletePostId(p.id)} className="flex items-center gap-1 font-bold text-primary">
                          <Icon name="delete" className="text-[16px]" /> Delete
                        </button>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon="photo_library" title="No posts yet" description="Share your first ride photo from Community." />
              )}
            </Row>
          )}

          <Row
            icon="groups"
            iconClass="text-secondary"
            title="My clubs"
            count={myClubs.length}
            sub={myClubs.map((c) => c.name).join(", ") || "No clubs yet"}
            open={open === "clubs"}
            onToggle={() => toggle("clubs")}
          >
            {myClubs.length ? (
              <ul className="flex flex-col gap-2">
                {myClubs.map((c) => (
                  <li key={c.id} className="rounded-lg bg-inset p-3">
                    <p className="font-bold">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.location} · {c.memberIds.length} member{c.memberIds.length === 1 ? "" : "s"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="groups" title="No clubs yet" description="Join a club from Community." />
            )}
          </Row>

          <Row
            icon="route"
            iconClass="text-gold-foreground"
            title="My rides"
            count={myRides.length}
            sub={myRides.map((r) => r.title).join(", ") || "No rides yet"}
            open={open === "rides"}
            onToggle={() => toggle("rides")}
          >
            {myRides.length ? (
              <ul className="flex flex-col gap-2">
                {myRides.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-inset p-3">
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{r.title}</span>
                      <span className="block truncate text-sm text-muted-foreground">{r.meetPoint} · {r.distanceMiles} mi</span>
                    </span>
                    {r.cancelled && <span className="shrink-0 rounded-sm bg-elevated px-1.5 py-0.5 text-mono-badge text-muted-foreground">Cancelled</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="route" title="No rides yet" description="Join or organise a group ride in Community." />
            )}
          </Row>

          {/* Settings entry */}
          <Link to="/settings" className="hairline-card flex items-center gap-4 p-4 hover:bg-elevated">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-elevated">
              <Icon name="tune" className="text-[24px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-headline-md">Settings</span>
              <span className="block truncate text-muted-foreground">Account, privacy, notifications, appearance, support</span>
            </span>
            <Icon name="chevron_right" />
          </Link>
        </div>

        <p className="text-center text-mono-badge text-muted-foreground">THROTTLE · Prototype v1</p>
      </PageBody>

      {/* Edit profile */}
      <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit profile" description="Saved on this device and shown across the app.">
        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
          <FormField label="Display name" value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} />
          <FormField label="Username" value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} hint="3–20 letters, numbers, dots or underscores." />
          <div>
            <TextAreaField label="Bio" value={draft.bio} maxLength={BIO_MAX} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
            <p className="mt-1 text-right text-xs text-muted-foreground">{draft.bio.length}/{BIO_MAX}</p>
          </div>
          <FormField label="Location (optional)" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="experience" className="text-label-caps text-secondary">Riding experience</label>
            <select
              id="experience"
              value={draft.experience}
              onChange={(e) => setDraft({ ...draft, experience: e.target.value })}
              className="h-11 w-full rounded-lg border border-border bg-inset px-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {EXPERIENCE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <FormField
            label="Riding interests"
            value={draft.interests.join(", ")}
            onChange={(e) => setDraft({ ...draft, interests: e.target.value.split(",") })}
            hint="Comma-separated, e.g. Commuting, Touring, Track days."
          />
          <FormField
            label="Motorcycle brands"
            value={draft.brands.join(", ")}
            onChange={(e) => setDraft({ ...draft, brands: e.target.value.split(",") })}
            hint="Comma-separated, e.g. Yamaha, Triumph."
          />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <TButton variant="secondary" onClick={() => setEditOpen(false)}>Cancel</TButton>
          <TButton variant="primary" onClick={saveEdit}>
            <Icon name="save" /> Save
          </TButton>
        </div>
      </Modal>

      <ConfirmDialog
        open={deletePostId !== null}
        onOpenChange={(o) => !o && setDeletePostId(null)}
        title="Delete this post?"
        description="This removes the post from your profile and the community feed on this device."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletePostId) social.deletePost(deletePostId);
          setDeletePostId(null);
          toast.success("Post deleted.");
        }}
      />
    </>
  );
}
