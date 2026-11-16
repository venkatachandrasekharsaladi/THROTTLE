/**
 * Rider profile & settings logic for the THROTTLE prototype. All data lives
 * in localStorage (`throttle:profile`); there is no account system, so
 * email/password settings are display-only and labelled as such in the UI.
 * Validation and derivation rules live here so every surface agrees.
 */
import { rider } from "@/data/demo";
import { newId } from "@/lib/garage";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, ME_ID } from "@/lib/social";
import type {
  FeedbackEntry,
  FeedbackKind,
  GarageState,
  ProfileSettings,
  ProfileState,
  SocialState,
} from "@/types";

export const EXPERIENCE_OPTIONS = ["New rider", "1–3 years", "3–5 years", "5–10 years", "10+ years"] as const;

export const INTEREST_SUGGESTIONS = [
  "Commuting",
  "Touring",
  "Track days",
  "Off-road",
  "Café racers",
  "Restorations",
  "Group rides",
] as const;

export const BIO_MAX = 200;

/* ---------- Seed & normalize ---------- */

export function seedProfile(): ProfileState {
  return {
    profile: {
      displayName: rider.name,
      username: "alexrides",
      bio: "London rider. Weekday commuter, weekend wanderer.",
      location: rider.location,
      interests: ["Commuting", "Touring"],
      experience: "3–5 years",
      brands: ["Yamaha"],
      email: "alex.morgan@example.co.uk",
    },
    privacy: { publicProfile: true, showLocation: true, showGarage: true, showPosts: true },
    notifications: { enabled: true, community: true, rides: true, clubs: true, account: true },
    feedback: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const strList = (v: unknown, fallback: string[]) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : fallback;

/** Validate stored profile data; fall back to the seed when invalid. */
export function normalizeProfile(value: unknown): ProfileState {
  const seed = seedProfile();
  if (!isRecord(value)) return seed;
  const p = isRecord(value["profile"]) ? value["profile"] : {};
  const pr = isRecord(value["privacy"]) ? value["privacy"] : {};
  const n = isRecord(value["notifications"]) ? value["notifications"] : {};
  return {
    profile: {
      displayName: str(p["displayName"], seed.profile.displayName),
      username: str(p["username"], seed.profile.username),
      bio: str(p["bio"], seed.profile.bio),
      location: str(p["location"], seed.profile.location),
      interests: strList(p["interests"], seed.profile.interests),
      experience: str(p["experience"], seed.profile.experience),
      brands: strList(p["brands"], seed.profile.brands),
      avatarDataUrl: typeof p["avatarDataUrl"] === "string" ? p["avatarDataUrl"] : undefined,
      email: str(p["email"], seed.profile.email),
    },
    privacy: {
      publicProfile: bool(pr["publicProfile"], seed.privacy.publicProfile),
      showLocation: bool(pr["showLocation"], seed.privacy.showLocation),
      showGarage: bool(pr["showGarage"], seed.privacy.showGarage),
      showPosts: bool(pr["showPosts"], seed.privacy.showPosts),
    },
    notifications: {
      enabled: bool(n["enabled"], seed.notifications.enabled),
      community: bool(n["community"], seed.notifications.community),
      rides: bool(n["rides"], seed.notifications.rides),
      clubs: bool(n["clubs"], seed.notifications.clubs),
      account: bool(n["account"], seed.notifications.account),
    },
    feedback: Array.isArray(value["feedback"]) ? (value["feedback"] as FeedbackEntry[]) : [],
  };
}

/* ---------- Validation ---------- */

export function validateProfile(input: ProfileSettings): string | null {
  if (input.displayName.trim().length < 2) return "Enter your display name.";
  if (!/^[a-z0-9._]{3,20}$/i.test(input.username.trim()))
    return "Usernames are 3–20 letters, numbers, dots or underscores.";
  if (input.bio.length > BIO_MAX) return `Bio is limited to ${BIO_MAX} characters.`;
  return null;
}

export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return "Enter a valid email address.";
  return null;
}

export function validateAvatar(file: { type: string; size: number }): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Photos must be JPEG, PNG or WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "Profile photos must be under 2 MB.";
  return null;
}

export function validateFeedback(message: string): string | null {
  if (message.trim().length < 10) return "Tell us a little more (at least 10 characters).";
  if (message.length > 1000) return "Keep it under 1,000 characters.";
  return null;
}

export function makeFeedback(kind: FeedbackKind, message: string): FeedbackEntry {
  return { id: newId(), kind, message: message.trim(), createdAt: new Date().toISOString() };
}

/* ---------- Riding statistics (derived — never stored) ---------- */

export interface RidingStats {
  bikeCount: number;
  totalMiles: number;
  postCount: number;
  clubCount: number;
  rideCount: number;
  followerCount: number;
  followingCount: number;
}

/** Profile statistics derived from the live garage and community state. */
export function ridingStats(garage: GarageState, social: SocialState): RidingStats {
  return {
    bikeCount: garage.bikes.length,
    totalMiles: garage.bikes.reduce((sum, g) => sum + g.bike.mileage, 0),
    postCount: social.posts.filter((p) => p.authorId === ME_ID).length,
    clubCount: social.clubs.filter((c) => c.memberIds.includes(ME_ID)).length,
    rideCount: social.rides.filter((r) => r.participantIds.includes(ME_ID)).length,
    followerCount: social.riders.filter((r) => r.isDemo && social.followingIds.includes(r.id)).length,
    followingCount: social.followingIds.length,
  };
}
