export type ThemeMode = "light" | "dark" | "system";

export type Status = "good" | "due" | "urgent" | "info";

export interface Rider {
  id: string;
  name: string;
  firstName: string;
  location: string;
  memberSince: number;
  avatar: string;
}

export type MileageUnit = "mi" | "km";

export interface Motorcycle {
  id: string;
  year: number;
  make: string;
  model: string;
  nickname: string;
  engineCc: number;
  engineType?: string | undefined;
  power?: string | undefined;
  kerbWeightKg?: number | undefined;
  registration?: string | undefined;
  colour?: string | undefined;
  /** Current odometer reading — the single source of truth for mileage. */
  mileage: number;
  mileageUnit?: MileageUnit | undefined;
  lastMileageUpdatedAt?: string | undefined; // ISO date-time
  image?: string | undefined;
  purchaseDate?: string | undefined; // ISO
  purchasePriceGbp?: number | undefined;
  notes?: string | undefined;
}

export type MileageUpdateMethod = "Manual" | "Trip Entry" | "Correction";

/** Audit-trail entry created by every odometer change. */
export interface MileageEntry {
  id: string;
  bikeId: string;
  previousMileage: number;
  newMileage: number;
  distanceMiles: number;
  updatedAt: string; // ISO date-time
  method: MileageUpdateMethod;
  note?: string | undefined;
}

/** A logged fuel purchase; mileage is recorded at fill-up time and never overwritten. */
export interface FuelRecord {
  id: string;
  date: string; // ISO
  litres: number;
  costGbp: number;
  mileage: number;
  /** Full-tank fills bracket the distance used for full-to-full MPG. */
  fullTank?: boolean | undefined;
  station?: string | undefined;
  notes?: string | undefined;
}

/** Legacy reminder shape used by the Home dashboard card. */
export interface MaintenanceItem {
  id: string;
  title: string;
  detail: string;
  dueInMiles?: number | undefined;
  dueLabel: string;
  status: Status;
}

export type MaintenanceCategory =
  | "Engine oil"
  | "Oil filter"
  | "Air filter"
  | "Chain"
  | "Brakes"
  | "Tyres"
  | "Coolant"
  | "Spark plugs"
  | "General inspection"
  | "Other";

export const MAINTENANCE_CATEGORIES: MaintenanceCategory[] = [
  "Engine oil",
  "Oil filter",
  "Air filter",
  "Chain",
  "Brakes",
  "Tyres",
  "Coolant",
  "Spark plugs",
  "General inspection",
  "Other",
];

export type TaskStatus = "overdue" | "dueSoon" | "upcoming" | "completed";

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  category: MaintenanceCategory;
  dueDate?: string | undefined; // ISO
  dueMileage?: number | undefined;
  lastCompletedDate?: string | undefined; // ISO
  lastCompletedMileage?: number | undefined;
  notes?: string | undefined;
}

export interface CompletedTask extends MaintenanceTask {
  completedDate: string; // ISO
  completedMileage: number;
  costGbp?: number | undefined;
  completionNotes?: string | undefined;
}

export interface ServiceRecord {
  id: string;
  title: string;
  workshop?: string | undefined;
  mileage: number;
  date: string; // ISO
  costGbp: number;
  description?: string | undefined;
  notes?: string | undefined;
  receiptName?: string | undefined;
}

export type DocumentType = "MOT certificate" | "Insurance" | "Service receipt" | "Warranty" | "Other";

export const DOCUMENT_TYPES: DocumentType[] = [
  "MOT certificate",
  "Insurance",
  "Service receipt",
  "Warranty",
  "Other",
];

export interface BikeDocument {
  id: string;
  title: string;
  type: DocumentType;
  detail?: string | undefined;
  issueDate?: string | undefined; // ISO
  expiryDate?: string | undefined; // ISO
  notes?: string | undefined;
  fileName?: string | undefined;
}

/** Everything stored per motorcycle in the prototype garage. */
export interface BikeGarage {
  bike: Motorcycle;
  tasks: MaintenanceTask[];
  completed: CompletedTask[];
  services: ServiceRecord[];
  documents: BikeDocument[];
  mileageHistory: MileageEntry[];
  fuelRecords: FuelRecord[];
}

export interface GarageState {
  activeId: string;
  bikes: BikeGarage[];
}

export interface FuelSummary {
  averageMpg: number;
  fuelGrade: string;
  seasonSpendGbp: number;
  lastFillLitres: number;
  lastFillGbp: number;
}

export type FuelFilter = "e5" | "open24" | "bikeParking";

export interface FuelStation {
  id: string;
  brand: string;
  name: string;
  area: string;
  postcode: string;
  distanceMiles: number;
  e10PricePence: number;
  e5PricePence: number;
  updatedLabel: string;
  open24: boolean;
  bikeParking: boolean;
  amenities: string[];
  /** Position on the illustrative map, 0–100 percent */
  mapX: number;
  mapY: number;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorInitials: string;
  bike: string;
  location: string;
  timeLabel: string;
  body: string;
  image?: string | undefined;
  likes: number;
  comments: number;
}

export interface Club {
  id: string;
  name: string;
  area: string;
  members: number;
  description: string;
}

export interface RideEvent {
  id: string;
  title: string;
  type: string;
  dateLabel: string;
  meetPoint: string;
  description: string;
  ridersConfirmed: number;
  clubId?: string | undefined;
  distanceMiles: number;
}

export interface RouteSuggestion {
  id: string;
  name: string;
  road: string;
  region: string;
  lengthMiles: number;
}

/* ---------- Phase 4: community & social (local prototype) ---------- */

/** A rider profile. "me" is the local user; the rest are demo riders. */
export interface RiderProfile {
  id: string;
  username: string;
  name: string;
  initials: string;
  location: string;
  bike: string;
  bio: string;
  joinedLabel: string;
  avatar?: string | undefined;
  isDemo: boolean;
}

export interface PostComment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string; // ISO date-time
  parentId?: string | undefined;
}

export interface SocialPost {
  id: string;
  authorId: string;
  caption: string;
  hashtags: string[];
  /** Data URLs (local uploads) or bundled asset paths (demo posts). */
  images: string[];
  bikeId?: string | undefined;
  bikeLabel?: string | undefined;
  location?: string | undefined;
  clubId?: string | undefined;
  createdAt: string; // ISO date-time
  likedBy: string[];
  comments: PostComment[];
}

export interface ClubAnnouncement {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface SocialClub {
  id: string;
  name: string;
  description: string;
  location: string;
  isPrivate: boolean;
  adminIds: string[];
  moderatorIds: string[];
  memberIds: string[];
  announcements: ClubAnnouncement[];
  createdAt: string;
  isDemo?: boolean | undefined;
}

export type RideStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface SocialRide {
  id: string;
  title: string;
  description: string;
  meetPoint: string;
  destination: string;
  dateTime: string; // ISO date-time
  routeInfo?: string | undefined;
  distanceMiles: number;
  participantLimit?: number | undefined;
  organiserId: string;
  participantIds: string[];
  clubId?: string | undefined;
  cancelled?: boolean | undefined;
}

export type NotificationType =
  | "follow"
  | "like"
  | "comment"
  | "club_invite"
  | "ride_invite"
  | "ride_update"
  | "club_announcement";

export interface SocialNotification {
  id: string;
  type: NotificationType;
  text: string;
  createdAt: string;
  read: boolean;
  isDemo: boolean;
}

export interface PostReport {
  postId: string;
  reason: string;
  createdAt: string;
}

/* ---------- Phase 5: rider profile & settings (local prototype) ---------- */

/** Editable rider profile fields, stored on this device. */
export interface ProfileSettings {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  interests: string[];
  experience: string;
  brands: string[];
  /** Local photo upload stored as a data URL; falls back to the demo avatar. */
  avatarDataUrl?: string | undefined;
  /** Display-only in the prototype — no account system is connected. */
  email: string;
}

export interface PrivacySettings {
  publicProfile: boolean;
  showLocation: boolean;
  showGarage: boolean;
  showPosts: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  community: boolean;
  rides: boolean;
  clubs: boolean;
  account: boolean;
}

export type FeedbackKind = "feedback" | "issue" | "support";

export interface FeedbackEntry {
  id: string;
  kind: FeedbackKind;
  message: string;
  createdAt: string; // ISO date-time
}

/** Everything the profile & settings prototype persists. */
export interface ProfileState {
  profile: ProfileSettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  feedback: FeedbackEntry[];
}

/** Everything the local community prototype persists. */
export interface SocialState {
  riders: RiderProfile[];
  posts: SocialPost[];
  clubs: SocialClub[];
  rides: SocialRide[];
  notifications: SocialNotification[];
  savedPostIds: string[];
  followingIds: string[];
  reports: PostReport[];
  blockedIds: string[];
}
