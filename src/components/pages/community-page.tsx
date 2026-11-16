import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppHeader, PageBody } from "@/components/throttle/app-header";
import { TButton } from "@/components/throttle/button";
import { ConfirmDialog, Modal } from "@/components/throttle/dialogs";
import { FormField, SearchField, TextAreaField } from "@/components/throttle/form-field";
import { Icon } from "@/components/throttle/icon";
import { SectionLabel } from "@/components/throttle/section-card";
import { EmptyState } from "@/components/throttle/states";
import { DemoBadge, StatusIndicator } from "@/components/throttle/status-indicator";
import { routes } from "@/data/demo";
import { useGarage } from "@/hooks/use-garage";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSocial } from "@/hooks/use-social";
import { formatNumber } from "@/lib/format";
import {
  canViewClubContent,
  DEMO_FOLLOWERS,
  DEMO_FOLLOWING,
  followerCount,
  isClubAdmin,
  MAX_IMAGES_PER_POST,
  ME_ID,
  rideStatus,
  riderById,
  timeAgo,
  validateImages,
  visiblePosts,
} from "@/lib/social";
import { cn } from "@/lib/utils";
import type { RiderProfile, RideStatus, SocialClub, SocialPost, SocialRide, SocialState } from "@/types";

const TABS = [
  { id: "feed", label: "Feed", icon: "forum" },
  { id: "discover", label: "Discover", icon: "group_search" },
  { id: "clubs", label: "Clubs", icon: "groups" },
  { id: "rides", label: "Rides", icon: "route" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const RIDE_STATUS_LABEL: Record<RideStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};
const RIDE_STATUS_TONE: Record<RideStatus, "good" | "info" | "due" | "urgent"> = {
  upcoming: "good",
  ongoing: "info",
  completed: "due",
  cancelled: "urgent",
};

export function CommunityPage() {
  const [tab, setTab] = useLocalStorage<Tab>("community-tab", "feed");
  const [composeOpen, setComposeOpen] = useState(false);
  const social = useSocial();
  const unread = social.state.notifications.filter((n) => !n.read).length;

  return (
    <>
      <AppHeader title="Community" />
      <PageBody>
        <div role="tablist" aria-label="Community sections" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex h-10 shrink-0 items-center gap-1.5 rounded-md px-4 text-label-caps transition-colors",
                tab === t.id ? "bg-navy text-navy-foreground" : "bg-card text-foreground hover:bg-elevated",
              )}
            >
              {tab === t.id && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              {t.label}
              {t.id === "notifications" && unread > 0 && (
                <span className="ml-1 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{unread}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "feed" && <FeedTab onCompose={() => setComposeOpen(true)} />}
        {tab === "discover" && <DiscoverTab />}
        {tab === "clubs" && <ClubsTab />}
        {tab === "rides" && <RidesTab />}
        {tab === "notifications" && <NotificationsTab />}

        <p className="text-center text-mono-badge text-muted-foreground">
          Community runs on this device only — demo riders and posts are sample data
        </p>
      </PageBody>

      <button
        type="button"
        onClick={() => {
          setTab("feed");
          setComposeOpen(true);
        }}
        aria-label="Create post"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground race-plate lg:bottom-8 lg:right-8"
      >
        <Icon name="edit" className="text-[24px]" />
      </button>

      <ComposeModal open={composeOpen} onOpenChange={setComposeOpen} />
    </>
  );
}

/* ---------- Shared bits ---------- */

function Avatar({ rider, size = "h-10 w-10" }: { rider: RiderProfile; size?: string }) {
  if (rider.avatar) return <img src={rider.avatar} alt="" className={cn(size, "rounded-lg object-cover")} />;
  return (
    <span className={cn(size, "flex items-center justify-center rounded-lg bg-secondary text-label-caps text-secondary-foreground")}>
      {rider.initials}
    </span>
  );
}

/* ---------- Feed ---------- */

function FeedTab({ onCompose }: { onCompose: () => void }) {
  const social = useSocial();
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);

  const posts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visiblePosts(social.state)
      .filter((p) => !savedOnly || social.state.savedPostIds.includes(p.id))
      .filter((p) => {
        if (!q) return true;
        const author = riderById(social.state, p.authorId);
        return `${author.name} ${author.username} ${p.caption} ${p.location ?? ""} ${p.hashtags.join(" ")}`
          .toLowerCase()
          .includes(q);
      });
  }, [social.state, query, savedOnly]);

  return (
    <>
      <div className="flex gap-2">
        <SearchField label="Search posts" placeholder="Search riders, bikes, #hashtags" value={query} onChange={(e) => setQuery(e.target.value)} />
        <TButton onClick={onCompose}>
          <Icon name="add" /> <span className="hidden sm:inline">New post</span>
        </TButton>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly((v) => !v)}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-label-caps transition-colors",
            savedOnly ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-card hover:bg-elevated",
          )}
        >
          <Icon name="bookmark" className="text-[16px]" /> Saved
        </button>
      </div>
      {posts.length === 0 ? (
        <EmptyState icon="forum" title="No posts found" description={savedOnly ? "You haven't saved any posts yet." : "Try a different search."} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const social = useSocial();
  const author = riderById(social.state, post.authorId);
  const mine = post.authorId === ME_ID;
  const liked = post.likedBy.includes(ME_ID);
  const saved = social.state.savedPostIds.includes(post.id);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [photo, setPhoto] = useState(0);

  const club = post.clubId ? social.state.clubs.find((c) => c.id === post.clubId) : undefined;

  const submitComment = () => {
    const error = social.addComment(post.id, comment, replyTo ?? undefined);
    if (error) {
      toast.error(error);
      return;
    }
    setComment("");
    setReplyTo(null);
  };

  return (
    <article className="hairline-card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <Avatar rider={author} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-headline-sm">
            {author.name} <span className="text-muted-foreground">@{author.username}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {timeAgo(post.createdAt)}
            {post.location ? ` · ${post.location}` : ""}
            {club ? ` · ${club.name}` : ""}
          </p>
        </div>
        {author.isDemo && <DemoBadge />}
        <div className="relative">
          <TButton variant="ghost" size="sm" aria-label="Post options" onClick={() => setMenuOpen((v) => !v)}>
            <Icon name="more_vert" className="text-[20px]" />
          </TButton>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 flex w-44 flex-col rounded-lg border border-border bg-background p-1 shadow-soft">
              {mine ? (
                <>
                  <MenuItem icon="edit" label="Edit post" onClick={() => { setMenuOpen(false); setEditOpen(true); }} />
                  <MenuItem icon="delete" label="Delete post" onClick={() => { setMenuOpen(false); setDeleteOpen(true); }} />
                </>
              ) : (
                <>
                  <MenuItem icon="flag" label="Report post" onClick={() => { setMenuOpen(false); setReportOpen(true); }} />
                  <MenuItem
                    icon="block"
                    label={`Block @${author.username}`}
                    onClick={() => {
                      social.blockRider(author.id);
                      setMenuOpen(false);
                      toast.success(`Blocked @${author.username}`);
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {post.images.length > 0 && (
        <div className="relative">
          <img src={post.images[photo]} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
          {post.images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {post.images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  onClick={() => setPhoto(i)}
                  className={cn("h-2 w-2 rounded-full", i === photo ? "bg-primary" : "bg-background/70")}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[15px]">{post.caption}</p>
      {post.hashtags.length > 0 && (
        <p className="flex flex-wrap gap-1.5">
          {post.hashtags.map((t) => (
            <span key={t} className="rounded-sm bg-inset px-1.5 py-0.5 text-mono-badge text-primary">
              #{t}
            </span>
          ))}
        </p>
      )}
      {post.bikeLabel && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="two_wheeler" className="text-[16px]" /> {post.bikeLabel}
        </p>
      )}

      <div className="flex items-center gap-1 border-t border-border pt-2">
        <TButton variant="ghost" size="sm" onClick={() => social.toggleLike(post.id)} aria-pressed={liked} aria-label="Like post">
          <Icon name={liked ? "favorite" : "favorite_border"} className={cn("text-[18px]", liked && "text-primary")} />
          {formatNumber(post.likedBy.length)}
        </TButton>
        <TButton variant="ghost" size="sm" onClick={() => setCommentOpen((v) => !v)} aria-expanded={commentOpen} aria-label="Comments">
          <Icon name="mode_comment" className="text-[18px]" /> {post.comments.length}
        </TButton>
        <TButton variant="ghost" size="sm" className="ml-auto" onClick={() => social.toggleSave(post.id)} aria-pressed={saved} aria-label="Save post">
          <Icon name={saved ? "bookmark" : "bookmark_border"} className={cn("text-[18px]", saved && "text-primary")} />
        </TButton>
      </div>

      {commentOpen && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {post.comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet — start the conversation.</p>}
          {post.comments
            .filter((c) => !c.parentId)
            .map((c) => (
              <div key={c.id} className="flex flex-col gap-1">
                <CommentRow comment={c} state={social.state} onReply={() => setReplyTo(c.id)} />
                {post.comments
                  .filter((r) => r.parentId === c.id)
                  .map((r) => (
                    <div key={r.id} className="pl-6">
                      <CommentRow comment={r} state={social.state} />
                    </div>
                  ))}
              </div>
            ))}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormField
                label={replyTo ? "Reply" : "Add a comment"}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={280}
                placeholder={replyTo ? "Write a reply…" : "Write a comment…"}
              />
            </div>
            {replyTo && (
              <TButton variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                Cancel
              </TButton>
            )}
            <TButton size="sm" onClick={submitComment} disabled={!comment.trim()}>
              Post
            </TButton>
          </div>
        </div>
      )}

      <EditPostModal post={post} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this post?"
        description="Your post and its comments will be removed from this device. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          social.deletePost(post.id);
          toast.success("Post deleted");
        }}
      />
      <ReportModal post={post} open={reportOpen} onOpenChange={setReportOpen} />
    </article>
  );
}

function CommentRow({
  comment,
  state,
  onReply,
}: {
  comment: SocialPost["comments"][number];
  state: SocialState;
  onReply?: () => void;
}) {
  const author = riderById(state, comment.authorId);
  return (
    <div className="rounded-lg bg-inset p-2.5">
      <p className="text-xs text-muted-foreground">
        <span className="font-bold text-foreground">{author.name}</span> · {timeAgo(comment.createdAt)}
      </p>
      <p className="text-sm">{comment.body}</p>
      {onReply && (
        <button type="button" onClick={onReply} className="mt-1 text-label-caps text-primary hover:underline">
          Reply
        </button>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-elevated"
    >
      <Icon name={icon} className="text-[18px] text-muted-foreground" /> {label}
    </button>
  );
}

function EditPostModal({ post, open, onOpenChange }: { post: SocialPost; open: boolean; onOpenChange: (o: boolean) => void }) {
  const social = useSocial();
  const [caption, setCaption] = useState(post.caption);
  const [location, setLocation] = useState(post.location ?? "");
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Edit post">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const error = social.editPost(post.id, caption, location);
          if (error) {
            toast.error(error);
            return;
          }
          toast.success("Post updated");
          onOpenChange(false);
        }}
        className="flex flex-col gap-3"
      >
        <TextAreaField label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} required />
        <FormField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={60} />
        <TButton type="submit">Save changes</TButton>
      </form>
    </Modal>
  );
}

function ReportModal({ post, open, onOpenChange }: { post: SocialPost; open: boolean; onOpenChange: (o: boolean) => void }) {
  const social = useSocial();
  const [reason, setReason] = useState("");
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Report post" description="Reports are stored on this device in this prototype.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!reason.trim()) return;
          social.reportPost(post.id, reason.trim());
          toast.success("Report recorded");
          setReason("");
          onOpenChange(false);
        }}
        className="flex flex-col gap-3"
      >
        <TextAreaField label="What's wrong with this post?" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={280} required />
        <TButton type="submit" disabled={!reason.trim()}>
          Submit report
        </TButton>
      </form>
    </Modal>
  );
}

/* ---------- Compose ---------- */

function ComposeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const social = useSocial();
  const garage = useGarage();
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [bikeId, setBikeId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setCaption("");
    setLocation("");
    setBikeId("");
    setImages([]);
    setImageNames([]);
  };

  const pickFiles = async (files: FileList | null) => {
    if (!files) return;
    const list = [...files];
    const error = validateImages(list);
    if (error) {
      toast.error(error);
      return;
    }
    const urls = await Promise.all(
      list.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("read failed"));
            reader.readAsDataURL(f);
          }),
      ),
    );
    setImages(urls);
    setImageNames(list.map((f) => f.name));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const bike = garage.state.bikes.find((b) => b.bike.id === bikeId)?.bike;
    const error = social.publishPost({
      caption,
      images,
      bikeId: bike?.id,
      bikeLabel: bike ? `${bike.year} ${bike.make} ${bike.model}` : undefined,
      location,
    });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Posted to the community feed");
    reset();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New post" description="Posts are saved on this device only — nothing is published.">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextAreaField
          label="What's the ride report?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={500}
          required
          placeholder="Share the ride… use #hashtags to tag it"
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Location" placeholder="e.g. Box Hill, Surrey" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={60} />
          <label className="flex flex-col gap-1.5">
            <span className="text-label-caps text-secondary">Bike (optional)</span>
            <select
              value={bikeId}
              onChange={(e) => setBikeId(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-inset px-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None</option>
              {garage.state.bikes.map((b) => (
                <option key={b.bike.id} value={b.bike.id}>
                  {b.bike.nickname}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void pickFiles(e.target.files)}
          />
          <TButton type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="add_photo_alternate" className="text-[18px]" />
            {images.length > 0 ? `${images.length} photo${images.length === 1 ? "" : "s"} added` : `Add photos (max ${MAX_IMAGES_PER_POST})`}
          </TButton>
          {imageNames.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{imageNames.join(", ")}</p>}
          {images.length > 0 && (
            <div className="mt-2 flex gap-2">
              {images.map((src, i) => (
                <img key={i} src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>
        <TButton type="submit" disabled={!caption.trim()}>
          Post
        </TButton>
      </form>
    </Modal>
  );
}

/* ---------- Discover ---------- */

function DiscoverTab() {
  const social = useSocial();
  const [query, setQuery] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const riders = social.state.riders.filter(
    (r) => r.id !== ME_ID && !social.state.blockedIds.includes(r.id) && (!q || `${r.username} ${r.name} ${r.location}`.toLowerCase().includes(q)),
  );
  const profile = profileId ? social.state.riders.find((r) => r.id === profileId) : null;

  return (
    <>
      <SearchField label="Search riders" placeholder="Search by username, name or area" value={query} onChange={(e) => setQuery(e.target.value)} />
      {riders.length === 0 ? (
        <EmptyState icon="group_search" title="No riders found" description="Try another username or area." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {riders.map((r) => {
            const following = social.state.followingIds.includes(r.id);
            const mutual = following; // demo riders you follow are treated as mutuals in the seed
            return (
              <li key={r.id} className="hairline-card flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <Avatar rider={r} size="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-headline-sm">{r.name}</p>
                    <p className="text-sm text-muted-foreground">@{r.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.location} · {r.bike}
                    </p>
                  </div>
                  <DemoBadge />
                </div>
                <p className="text-sm text-muted-foreground">{r.bio}</p>
                <div className="flex items-center gap-2">
                  <TButton variant={following ? "outline" : "dark"} size="sm" aria-pressed={following} onClick={() => social.toggleFollow(r.id)}>
                    {following ? "Following" : "Follow"}
                  </TButton>
                  <TButton variant="ghost" size="sm" onClick={() => setProfileId(r.id)}>
                    View profile
                  </TButton>
                  {mutual && <StatusIndicator status="info" label="Mutual" />}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-md">Popular UK routes</h2>
          <DemoBadge />
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {routes.map((r, i) => (
            <li key={r.id} className="hairline-card flex items-center gap-3 p-4">
              <span className="text-data-lg text-primary">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex-1">
                <p className="text-headline-sm">{r.name}</p>
                <p className="text-sm text-muted-foreground">
                  {r.road} · {r.region}
                </p>
              </div>
              <span className="text-data-md">{r.lengthMiles} mi</span>
            </li>
          ))}
        </ul>
      </section>

      <Modal open={profile != null} onOpenChange={(o) => !o && setProfileId(null)} title={profile ? profile.name : ""}>
        {profile && <RiderProfileView rider={profile} />}
      </Modal>
    </>
  );
}

function RiderProfileView({ rider }: { rider: RiderProfile }) {
  const social = useSocial();
  const following = social.state.followingIds.includes(rider.id);
  const followers = followerCount(social.state, rider.id, DEMO_FOLLOWERS[rider.id] ?? 0);
  const followingCount = DEMO_FOLLOWING[rider.id] ?? 0;
  const posts = visiblePosts(social.state).filter((p) => p.authorId === rider.id);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar rider={rider} size="h-14 w-14" />
        <div>
          <p className="text-sm text-muted-foreground">@{rider.username}</p>
          <p className="text-xs text-muted-foreground">
            {rider.location} · {rider.joinedLabel}
          </p>
        </div>
      </div>
      <p className="text-sm">{rider.bio}</p>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon name="two_wheeler" className="text-[16px]" /> {rider.bike}
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          [formatNumber(followers), "Followers"],
          [formatNumber(followingCount), "Following"],
          [String(posts.length), "Posts"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg bg-inset p-2">
            <p className="text-data-md font-bold">{value}</p>
            <p className="text-mono-badge text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      {following && <p className="text-xs text-muted-foreground">You follow each other — mutual follower.</p>}
      <TButton variant={following ? "outline" : "dark"} size="sm" aria-pressed={following} onClick={() => social.toggleFollow(rider.id)}>
        {following ? "Unfollow" : "Follow"}
      </TButton>
      {posts.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Public posts</SectionLabel>
          {posts.map((p) => (
            <div key={p.id} className="rounded-lg bg-inset p-3">
              <p className="text-sm">{p.caption}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {timeAgo(p.createdAt)} · {p.likedBy.length} likes · {p.comments.length} comments
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Clubs ---------- */

function ClubsTab() {
  const social = useSocial();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = detailId ? social.state.clubs.find((c) => c.id === detailId) : null;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{social.state.clubs.length} clubs · {social.state.clubs.filter((c) => c.isPrivate).length} private</p>
        <TButton size="sm" onClick={() => setCreateOpen(true)}>
          <Icon name="add" className="text-[18px]" /> Create club
        </TButton>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {social.state.clubs.map((c) => {
          const member = social.isMember(c);
          return (
            <li key={c.id} className="hairline-card flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Icon name={c.isPrivate ? "lock" : "groups"} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-headline-md">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {c.location} · <span className="text-data-md">{formatNumber(c.memberIds.length)}</span> members
                    {c.isPrivate ? " · Private" : ""}
                  </p>
                </div>
                {c.isDemo && <DemoBadge />}
              </div>
              <p className="text-muted-foreground">{c.description}</p>
              <div className="flex items-center gap-2">
                <TButton
                  variant={member ? "outline" : "dark"}
                  size="sm"
                  aria-pressed={member}
                  onClick={() => (member ? social.leaveClub(c.id) : social.joinClub(c.id))}
                >
                  {member ? "Member · Leave" : c.isPrivate ? "Request to join" : "Join club"}
                </TButton>
                <TButton variant="ghost" size="sm" onClick={() => setDetailId(c.id)}>
                  View club
                </TButton>
              </div>
            </li>
          );
        })}
      </ul>

      <CreateClubModal open={createOpen} onOpenChange={setCreateOpen} />
      <Modal open={detail != null} onOpenChange={(o) => !o && setDetailId(null)} title={detail?.name ?? ""}>
        {detail && <ClubDetail club={detail} />}
      </Modal>
    </>
  );
}

function ClubDetail({ club }: { club: SocialClub }) {
  const social = useSocial();
  const member = social.isMember(club);
  const manager = social.canManage(club);
  const admin = isClubAdmin(club, ME_ID);
  const [announcement, setAnnouncement] = useState("");
  const visible = canViewClubContent(club, ME_ID);
  const clubPosts = visiblePosts(social.state).filter((p) => p.clubId === club.id);

  if (!visible) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{club.description}</p>
        <p className="flex items-center gap-2 rounded-lg bg-inset p-3 text-sm">
          <Icon name="lock" className="text-[18px] text-primary" /> This is a private club — join to see members, announcements and discussions.
        </p>
        <TButton size="sm" onClick={() => social.joinClub(club.id)}>
          Request to join
        </TButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {club.location} · {club.isPrivate ? "Private club" : "Public club"}
      </p>

      <section className="flex flex-col gap-2">
        <SectionLabel>Announcements</SectionLabel>
        {club.announcements.length === 0 && <p className="text-xs text-muted-foreground">No announcements yet.</p>}
        {club.announcements.map((a) => (
          <div key={a.id} className="rounded-lg bg-inset p-3">
            <p className="text-sm">{a.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {riderById(social.state, a.authorId).name} · {timeAgo(a.createdAt)}
            </p>
          </div>
        ))}
        {manager && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormField label="New announcement" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} maxLength={280} />
            </div>
            <TButton
              size="sm"
              disabled={!announcement.trim()}
              onClick={() => {
                const error = social.addAnnouncement(club.id, announcement);
                if (error) toast.error(error);
                else {
                  toast.success("Announcement posted");
                  setAnnouncement("");
                }
              }}
            >
              Post
            </TButton>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Members · {club.memberIds.length}</SectionLabel>
        <ul className="flex flex-col gap-1.5">
          {club.memberIds.map((id) => {
            const r = riderById(social.state, id);
            const role = club.adminIds.includes(id) ? "Admin" : club.moderatorIds.includes(id) ? "Moderator" : "Member";
            return (
              <li key={id} className="flex items-center gap-2 rounded-lg bg-inset px-3 py-2">
                <Avatar rider={r} size="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">@{r.username}</p>
                </div>
                <StatusIndicator status={role === "Admin" ? "urgent" : role === "Moderator" ? "info" : "good"} label={role} />
                {admin && id !== ME_ID && !club.adminIds.includes(id) && (
                  <>
                    <TButton variant="ghost" size="sm" onClick={() => social.toggleModerator(club.id, id)}>
                      {club.moderatorIds.includes(id) ? "Remove mod" : "Make mod"}
                    </TButton>
                    <TButton variant="ghost" size="sm" onClick={() => social.removeMember(club.id, id)}>
                      Remove
                    </TButton>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Discussion</SectionLabel>
        {clubPosts.length === 0 && <p className="text-xs text-muted-foreground">No club posts yet — mention this club when you post.</p>}
        {clubPosts.map((p) => (
          <div key={p.id} className="rounded-lg bg-inset p-3">
            <p className="text-sm">{p.caption}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {riderById(social.state, p.authorId).name} · {timeAgo(p.createdAt)}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

function CreateClubModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const social = useSocial();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Create a club" description="Clubs are stored on this device in this prototype.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const error = social.createClub({ name, description, location, isPrivate });
          if (error) {
            toast.error(error);
            return;
          }
          toast.success("Club created — you're the admin");
          setName("");
          setDescription("");
          setLocation("");
          setIsPrivate(false);
          onOpenChange(false);
        }}
        className="flex flex-col gap-3"
      >
        <FormField label="Club name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
        <TextAreaField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={280} required />
        <FormField label="Location / area" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={60} required />
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
          Private club — content visible to members only
        </label>
        <TButton type="submit">Create club</TButton>
      </form>
    </Modal>
  );
}

/* ---------- Rides ---------- */

function RidesTab() {
  const social = useSocial();
  const [createOpen, setCreateOpen] = useState(false);
  const rides = useMemo(
    () =>
      [...social.state.rides]
        .filter((r) => {
          if (!r.clubId) return true;
          const club = social.state.clubs.find((c) => c.id === r.clubId);
          return !club || canViewClubContent(club, ME_ID);
        })
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [social.state],
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rides.filter((r) => rideStatus(r) === "upcoming").length} upcoming</p>
        <TButton size="sm" onClick={() => setCreateOpen(true)}>
          <Icon name="add" className="text-[18px]" /> Plan a ride
        </TButton>
      </div>
      {rides.length === 0 ? (
        <EmptyState icon="route" title="No rides yet" description="Plan the first group ride." />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rides.map((r) => (
            <RideCard key={r.id} ride={r} />
          ))}
        </div>
      )}
      <CreateRideModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function RideCard({ ride }: { ride: SocialRide }) {
  const social = useSocial();
  const status = rideStatus(ride);
  const joined = ride.participantIds.includes(ME_ID);
  const organiser = ride.organiserId === ME_ID;
  const [cancelOpen, setCancelOpen] = useState(false);
  const club = ride.clubId ? social.state.clubs.find((c) => c.id === ride.clubId) : undefined;
  const when = new Date(ride.dateTime).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <article className="hairline-card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-headline-md">{ride.title}</h3>
          <p className="text-sm text-muted-foreground">
            {when} · {ride.distanceMiles} mi{club ? ` · ${club.name}` : ""}
          </p>
        </div>
        <StatusIndicator status={RIDE_STATUS_TONE[status]} label={RIDE_STATUS_LABEL[status]} dot />
      </div>
      <p className="text-sm text-muted-foreground">{ride.description}</p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <p className="rounded-lg bg-inset p-2">
          <span className="text-label-caps text-secondary">Meet</span>
          <br />
          {ride.meetPoint}
        </p>
        <p className="rounded-lg bg-inset p-2">
          <span className="text-label-caps text-secondary">Destination</span>
          <br />
          {ride.destination}
        </p>
      </div>
      {ride.routeInfo && <p className="text-xs text-muted-foreground">Route: {ride.routeInfo}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        <Icon name="group" className="text-[16px] text-muted-foreground" />
        {ride.participantIds.map((id) => (
          <span key={id} className="rounded-sm bg-inset px-1.5 py-0.5 text-mono-badge text-secondary">
            {riderById(social.state, id).initials}
          </span>
        ))}
        <span className="text-xs text-muted-foreground">
          {ride.participantIds.length}
          {ride.participantLimit != null ? ` / ${ride.participantLimit}` : ""} riding
        </span>
      </div>
      <div className="flex items-center gap-2">
        {organiser ? (
          <>
            <StatusIndicator status="info" label="You're the organiser" />
            {status === "upcoming" && (
              <TButton variant="outline" size="sm" className="ml-auto" onClick={() => setCancelOpen(true)}>
                Cancel ride
              </TButton>
            )}
          </>
        ) : joined ? (
          <TButton variant="outline" size="sm" className="ml-auto" onClick={() => social.leaveRide(ride.id)}>
            Joined · Leave
          </TButton>
        ) : (
          <TButton
            variant="dark"
            size="sm"
            className="ml-auto"
            disabled={status !== "upcoming"}
            onClick={() => {
              const error = social.joinRide(ride.id);
              if (error) toast.error(error);
              else toast.success("You're on the list");
            }}
          >
            {status === "upcoming" ? "Join ride" : RIDE_STATUS_LABEL[status]}
          </TButton>
        )}
      </div>
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this ride?"
        description={`“${ride.title}” will be marked as cancelled for all participants.`}
        confirmLabel="Cancel ride"
        onConfirm={() => {
          social.cancelRide(ride.id);
          toast.success("Ride cancelled");
        }}
      />
    </article>
  );
}

function CreateRideModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const social = useSocial();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetPoint, setMeetPoint] = useState("");
  const [destination, setDestination] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [routeInfo, setRouteInfo] = useState("");
  const [distance, setDistance] = useState("");
  const [limit, setLimit] = useState("");
  const myClubs = social.state.clubs.filter((c) => social.isMember(c));
  const [clubId, setClubId] = useState("");

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Plan a ride" description="Rides are stored on this device in this prototype.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const error = social.createRide({
            title,
            description,
            meetPoint,
            destination,
            dateTime,
            routeInfo,
            distanceMiles: Number(distance),
            participantLimit: limit ? Number(limit) : undefined,
            clubId: clubId || undefined,
          });
          if (error) {
            toast.error(error);
            return;
          }
          toast.success("Ride listed");
          setTitle(""); setDescription(""); setMeetPoint(""); setDestination(""); setDateTime(""); setRouteInfo(""); setDistance(""); setLimit(""); setClubId("");
          onOpenChange(false);
        }}
        className="flex flex-col gap-3"
      >
        <FormField label="Ride title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required />
        <TextAreaField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Meeting point" value={meetPoint} onChange={(e) => setMeetPoint(e.target.value)} maxLength={80} required />
          <FormField label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} maxLength={80} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date & time" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
          <FormField label="Distance (miles)" inputMode="numeric" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="46" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Route info (optional)" value={routeInfo} onChange={(e) => setRouteInfo(e.target.value)} placeholder="A24 via Dorking" maxLength={80} />
          <FormField label="Participant limit (optional)" inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="15" />
        </div>
        {myClubs.length > 0 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-label-caps text-secondary">Club (optional)</span>
            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-inset px-3 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">No club</option>
              {myClubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <TButton type="submit">List ride</TButton>
      </form>
    </Modal>
  );
}

/* ---------- Notifications ---------- */

const NOTIFICATION_ICON: Record<string, string> = {
  follow: "person_add",
  like: "favorite",
  comment: "mode_comment",
  club_invite: "groups",
  ride_invite: "mail",
  ride_update: "route",
  club_announcement: "campaign",
};

function NotificationsTab() {
  const social = useSocial();
  const notifications = social.state.notifications;
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unread} unread</p>
        <div className="flex items-center gap-2">
          <DemoBadge />
          {unread > 0 && (
            <TButton variant="ghost" size="sm" onClick={social.markAllRead}>
              Mark all read
            </TButton>
          )}
        </div>
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon="notifications" title="No notifications" description="Follows, likes, comments and ride updates will appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => social.markRead(n.id)}
                className={cn(
                  "hairline-card flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-elevated",
                  !n.read && "border-l-4 border-l-primary",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-inset text-primary">
                  <Icon name={NOTIFICATION_ICON[n.type] ?? "notifications"} className="text-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.read && "font-bold")}>{n.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(n.createdAt)}
                    {n.isDemo ? " · Demo" : ""}
                  </p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
