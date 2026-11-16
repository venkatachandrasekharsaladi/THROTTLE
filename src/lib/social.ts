/**
 * Community & social logic for the THROTTLE prototype. All data lives in
 * localStorage (`throttle:social`); demo riders, posts, clubs, rides and
 * notifications are sample data and labelled as such in the UI. Ownership
 * and permission rules (own-content edits, club roles, ride limits) are
 * enforced here so every surface behaves the same.
 */
import { rider } from "@/data/demo";
import { newId } from "@/lib/garage";
import type {
  NotificationType,
  PostComment,
  RiderProfile,
  RideStatus,
  SocialClub,
  SocialNotification,
  SocialPost,
  SocialRide,
  SocialState,
} from "@/types";
import snakePassImage from "@/assets/post-snake-pass.jpg";
import cafeImage from "@/assets/post-cafe.jpg";
import riderAlexImage from "@/assets/rider-alex.jpg";

export const ME_ID = "me";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB per photo
export const MAX_IMAGES_PER_POST = 4;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/* ---------- Helpers ---------- */

export function parseHashtags(caption: string): string[] {
  const found = caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return [...new Set(found.map((t) => t.slice(1).toLowerCase()))];
}

export function timeAgo(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Ride status: cancelled wins; otherwise derived from the date/time. */
export function rideStatus(ride: SocialRide, now = Date.now()): RideStatus {
  if (ride.cancelled) return "cancelled";
  const start = Date.parse(ride.dateTime);
  const end = start + 4 * 3_600_000; // assume a ride runs about 4 hours
  if (now < start) return "upcoming";
  if (now <= end) return "ongoing";
  return "completed";
}

export function canManageClub(club: SocialClub, riderId: string): boolean {
  return club.adminIds.includes(riderId) || club.moderatorIds.includes(riderId);
}

export function isClubAdmin(club: SocialClub, riderId: string): boolean {
  return club.adminIds.includes(riderId);
}

export function isClubMember(club: SocialClub, riderId: string): boolean {
  return club.memberIds.includes(riderId);
}

/** Private club content is visible to members only. */
export function canViewClubContent(club: SocialClub, riderId: string): boolean {
  return !club.isPrivate || isClubMember(club, riderId);
}

export function canJoinRide(ride: SocialRide, riderId: string, now = Date.now()): string | null {
  if (rideStatus(ride, now) !== "upcoming") return "This ride is no longer open.";
  if (ride.participantIds.includes(riderId)) return "You have already joined this ride.";
  if (ride.participantLimit != null && ride.participantIds.length >= ride.participantLimit)
    return "This ride is full.";
  return null;
}

export function riderById(state: SocialState, id: string): RiderProfile {
  return state.riders.find((r) => r.id === id) ?? state.riders[0]!;
}

/** Posts visible to me: blocked riders and non-member private-club posts hidden. */
export function visiblePosts(state: SocialState): SocialPost[] {
  return state.posts
    .filter((p) => !state.blockedIds.includes(p.authorId))
    .filter((p) => {
      if (!p.clubId) return true;
      const club = state.clubs.find((c) => c.id === p.clubId);
      return !club || canViewClubContent(club, ME_ID);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function followerCount(state: SocialState, riderId: string, demoFollowers: number): number {
  // Demo riders carry a seeded follower count; "me" gains one per demo rider I follow is
  // tracked separately — followers OF me are the demo riders flagged in the seed.
  if (riderId === ME_ID) return state.riders.filter((r) => r.isDemo && state.followingIds.includes(r.id)).length;
  return demoFollowers + (state.followingIds.includes(riderId) ? 1 : 0);
}

/* ---------- Validation ---------- */

export function validateImages(files: { type: string; size: number }[]): string | null {
  if (files.length > MAX_IMAGES_PER_POST) return `Add at most ${MAX_IMAGES_PER_POST} photos.`;
  for (const f of files) {
    if (!IMAGE_TYPES.includes(f.type)) return "Photos must be JPEG, PNG or WebP.";
    if (f.size > MAX_IMAGE_BYTES) return "Each photo must be under 2 MB.";
  }
  return null;
}

export function validatePost(caption: string): string | null {
  if (!caption.trim()) return "Write a caption for your post.";
  if (caption.length > 500) return "Captions are limited to 500 characters.";
  return null;
}

export function validateClub(name: string, description: string, location: string): string | null {
  if (name.trim().length < 3) return "Give the club a name (at least 3 characters).";
  if (!description.trim()) return "Add a short description.";
  if (!location.trim()) return "Add a location or area.";
  return null;
}

export function validateRide(input: {
  title: string;
  meetPoint: string;
  destination: string;
  dateTime: string;
  distanceMiles: number;
  participantLimit?: number | undefined;
}): string | null {
  if (input.title.trim().length < 3) return "Give the ride a title.";
  if (!input.meetPoint.trim()) return "Add a meeting point.";
  if (!input.destination.trim()) return "Add a destination.";
  if (!input.dateTime || Number.isNaN(Date.parse(input.dateTime))) return "Pick a date and time.";
  if (!Number.isFinite(input.distanceMiles) || input.distanceMiles <= 0) return "Enter the distance in miles.";
  if (input.participantLimit != null && input.participantLimit < 2) return "Participant limit must be at least 2.";
  return null;
}

/* ---------- Seed ---------- */

const demoRiders: RiderProfile[] = [
  {
    id: ME_ID,
    username: "alexrides",
    name: rider.name,
    initials: "AM",
    location: rider.location,
    bike: "2022 Yamaha MT-07",
    bio: "London rider. Weekday commuter, weekend wanderer.",
    joinedLabel: "Member since 2024",
    avatar: riderAlexImage,
    isDemo: false,
  },
  {
    id: "priya",
    username: "priya.peaks",
    name: "Priya S.",
    initials: "PS",
    location: "Sheffield",
    bike: "2023 Triumph Tiger 900 GT",
    bio: "Peak District regular. If it's muddy, I'm happy.",
    joinedLabel: "Member since 2023",
    isDemo: true,
  },
  {
    id: "tom",
    username: "thruxton.tom",
    name: "Tom H.",
    initials: "TH",
    location: "Bristol",
    bike: "2019 Triumph Thruxton RS",
    bio: "Café racer, café stops. Devon coast runs.",
    joinedLabel: "Member since 2022",
    isDemo: true,
  },
  {
    id: "mia",
    username: "mia.motorway",
    name: "Mia K.",
    initials: "MK",
    location: "Manchester",
    bike: "2021 Honda CB650R",
    bio: "Year-round commuter, occasional track day.",
    joinedLabel: "Member since 2024",
    isDemo: true,
  },
  {
    id: "ollie",
    username: "ollie.gt",
    name: "Ollie G.",
    initials: "OG",
    location: "Glasgow",
    bike: "2020 Kawasaki Z900",
    bio: "Highlands or bust. Camped more nights than I can count.",
    joinedLabel: "Member since 2021",
    isDemo: true,
  },
];

/** Seeded follower counts for demo riders (sample figures). */
export const DEMO_FOLLOWERS: Record<string, number> = { priya: 214, tom: 167, mia: 98, ollie: 142 };
export const DEMO_FOLLOWING: Record<string, number> = { priya: 180, tom: 145, mia: 121, ollie: 96 };

export function seedSocial(): SocialState {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
  return {
    riders: demoRiders.map((r) => ({ ...r })),
    posts: [
      {
        id: "p1",
        authorId: "priya",
        caption: "Cold, clear and quiet on the A57 this morning. Moorland all to ourselves before the cyclists arrived. Heated grips earned their keep. #snakepass #peakdistrict",
        hashtags: ["snakepass", "peakdistrict"],
        images: [snakePassImage],
        bikeLabel: "2023 Triumph Tiger 900 GT",
        location: "Snake Pass, Peak District",
        createdAt: hoursAgo(2),
        likedBy: ["tom", "mia", "ollie"],
        comments: [
          { id: "c1", authorId: "tom", body: "That light is unreal. Worth the cold?", createdAt: hoursAgo(1.5) },
          { id: "c2", authorId: "priya", body: "Every minute of it.", createdAt: hoursAgo(1.4), parentId: "c1" },
        ],
      },
      {
        id: "p2",
        authorId: "tom",
        caption: "Bacon roll, sea view, wet roads. Perfect end to the coast run — chain cleaned before the ride home. #caferacer #devon",
        hashtags: ["caferacer", "devon"],
        images: [cafeImage],
        bikeLabel: "2019 Triumph Thruxton RS",
        location: "North Devon coast",
        createdAt: hoursAgo(5),
        likedBy: ["priya", "mia"],
        comments: [{ id: "c3", authorId: "mia", body: "That café is on my list for spring.", createdAt: hoursAgo(4) }],
      },
      {
        id: "p3",
        authorId: "mia",
        caption: "New tyres scrubbed in on the commute. The CB feels planted again. #commuter #cb650r",
        hashtags: ["commuter", "cb650r"],
        images: [],
        bikeLabel: "2021 Honda CB650R",
        location: "Manchester",
        createdAt: hoursAgo(9),
        likedBy: ["ollie"],
        comments: [],
      },
    ],
    clubs: [
      {
        id: "thames-night",
        name: "Thames Night Riders",
        description: "Late-evening city loops along the river and Embankment.",
        location: "Central London",
        isPrivate: false,
        adminIds: ["priya"],
        moderatorIds: ["tom"],
        memberIds: ["priya", "tom", "mia", ME_ID],
        isDemo: true,
        announcements: [
          {
            id: "a1",
            authorId: "priya",
            body: "Thursday's loop starts at Chelsea Bridge, 19:30. Hi-viz recommended — roads are greasy.",
            createdAt: hoursAgo(20),
          },
        ],
        createdAt: hoursAgo(24 * 90),
      },
      {
        id: "surrey-twins",
        name: "Surrey Hills Twins Club",
        description: "Parallel and V-twin owners. Sunday breakfast runs.",
        location: "Surrey",
        isPrivate: false,
        adminIds: ["tom"],
        moderatorIds: [],
        memberIds: ["tom", ME_ID],
        isDemo: true,
        announcements: [],
        createdAt: hoursAgo(24 * 60),
      },
      {
        id: "highland-crew",
        name: "Highland Crew",
        description: "Invite-only group for multi-day Highlands tours. Members share routes and bothy tips.",
        location: "Scotland",
        isPrivate: true,
        adminIds: ["ollie"],
        moderatorIds: [],
        memberIds: ["ollie", "mia"],
        isDemo: true,
        announcements: [
          { id: "a2", authorId: "ollie", body: "June tour dates pencilled in — check the rides tab.", createdAt: hoursAgo(30) },
        ],
        createdAt: hoursAgo(24 * 45),
      },
    ],
    rides: [
      {
        id: "box-hill",
        title: "Box Hill Sunday Breakfast Run",
        description: "Steady pace from Clapham via the A24. Breakfast at the top, back by noon. All bikes welcome.",
        meetPoint: "Box Hill viewpoint, Surrey",
        destination: "Box Hill, Surrey",
        dateTime: new Date(now + 6 * 86_400_000).toISOString(),
        routeInfo: "A24 via Dorking",
        distanceMiles: 46,
        participantLimit: 15,
        organiserId: "tom",
        participantIds: ["tom", "priya", "mia"],
        clubId: "surrey-twins",
      },
      {
        id: "embankment",
        title: "Embankment Night Loop",
        description: "A relaxed lap of the river bridges with a tea stop in Hackney.",
        meetPoint: "Chelsea Bridge, SW1",
        destination: "Hackney, East London",
        dateTime: new Date(now + 10 * 86_400_000).toISOString(),
        routeInfo: "River bridges loop",
        distanceMiles: 22,
        organiserId: "priya",
        participantIds: ["priya", "ollie"],
        clubId: "thames-night",
      },
      {
        id: "highland-tour",
        title: "Highlands Three-Day Tour",
        description: "Members-only tour: Glencoe, Applecross and back. Bring camping kit.",
        meetPoint: "Glasgow, George Square",
        destination: "Applecross, Highlands",
        dateTime: new Date(now + 30 * 86_400_000).toISOString(),
        routeInfo: "A82 via Glencoe",
        distanceMiles: 420,
        participantLimit: 8,
        organiserId: "ollie",
        participantIds: ["ollie", "mia"],
        clubId: "highland-crew",
      },
    ],
    notifications: [
      { id: "n1", type: "follow", text: "Priya S. (@priya.peaks) started following you.", createdAt: hoursAgo(3), read: false, isDemo: true },
      { id: "n2", type: "like", text: "Tom H. liked your post from the Surrey Hills.", createdAt: hoursAgo(7), read: false, isDemo: true },
      { id: "n3", type: "club_announcement", text: "Thames Night Riders: Thursday's loop starts at Chelsea Bridge, 19:30.", createdAt: hoursAgo(20), read: true, isDemo: true },
      { id: "n4", type: "ride_invite", text: "Ollie G. invited you to Highlands Three-Day Tour.", createdAt: hoursAgo(26), read: true, isDemo: true },
    ],
    savedPostIds: [],
    followingIds: ["priya"],
    reports: [],
    blockedIds: [],
  };
}

/* ---------- Storage validation ---------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate stored social data; fall back to the seed when invalid. */
export function normalizeSocial(value: unknown): SocialState {
  const seed = seedSocial();
  if (!isRecord(value)) return seed;
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const riders = arr<RiderProfile>(value["riders"]);
  if (riders.length === 0 || !riders.some((r) => r.id === ME_ID)) return seed;
  return {
    riders,
    posts: arr<SocialPost>(value["posts"]),
    clubs: arr<SocialClub>(value["clubs"]),
    rides: arr<SocialRide>(value["rides"]),
    notifications: arr<SocialNotification>(value["notifications"]),
    savedPostIds: arr<string>(value["savedPostIds"]),
    followingIds: arr<string>(value["followingIds"]),
    reports: arr(value["reports"]),
    blockedIds: arr<string>(value["blockedIds"]),
  };
}

export function makeNotification(type: NotificationType, text: string): SocialNotification {
  return { id: newId(), type, text, createdAt: new Date().toISOString(), read: false, isDemo: false };
}

export function makeComment(authorId: string, body: string, parentId?: string): PostComment {
  return { id: newId(), authorId, body, createdAt: new Date().toISOString(), parentId };
}
