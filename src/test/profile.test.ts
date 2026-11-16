import { describe, expect, it } from "vitest";
import {
  BIO_MAX,
  makeFeedback,
  normalizeProfile,
  ridingStats,
  seedProfile,
  validateAvatar,
  validateEmail,
  validateFeedback,
  validateProfile,
} from "@/lib/profile";
import { seedGarage } from "@/lib/garage";
import { seedSocial } from "@/lib/social";

const valid = seedProfile().profile;

describe("validateProfile", () => {
  it("accepts the seeded profile", () => {
    expect(validateProfile(valid)).toBeNull();
  });

  it("rejects a display name under 2 characters", () => {
    expect(validateProfile({ ...valid, displayName: "A" })).toMatch(/display name/i);
  });

  it("rejects usernames with spaces or symbols", () => {
    expect(validateProfile({ ...valid, username: "alex rides!" })).toMatch(/username/i);
    expect(validateProfile({ ...valid, username: "ab" })).toMatch(/username/i);
  });

  it("rejects a bio over the limit", () => {
    expect(validateProfile({ ...valid, bio: "x".repeat(BIO_MAX + 1) })).toMatch(/limited/i);
  });
});

describe("validateEmail", () => {
  it("accepts a normal UK address", () => {
    expect(validateEmail("alex.morgan@example.co.uk")).toBeNull();
  });

  it("rejects malformed addresses", () => {
    expect(validateEmail("not-an-email")).toMatch(/valid email/i);
    expect(validateEmail("a@b")).toMatch(/valid email/i);
  });
});

describe("validateAvatar", () => {
  it("accepts a small JPEG", () => {
    expect(validateAvatar({ type: "image/jpeg", size: 500_000 })).toBeNull();
  });

  it("rejects GIFs and files over 2 MB", () => {
    expect(validateAvatar({ type: "image/gif", size: 1000 })).toMatch(/JPEG, PNG or WebP/);
    expect(validateAvatar({ type: "image/png", size: 3 * 1024 * 1024 })).toMatch(/under 2 MB/);
  });
});

describe("validateFeedback", () => {
  it("requires at least 10 characters", () => {
    expect(validateFeedback("too short")).toMatch(/at least 10/i);
    expect(validateFeedback("This is a proper bit of feedback.")).toBeNull();
  });
});

describe("normalizeProfile", () => {
  it("falls back to the seed for garbage input", () => {
    expect(normalizeProfile(null)).toEqual(seedProfile());
    expect(normalizeProfile("nope")).toEqual(seedProfile());
  });

  it("keeps stored values and fills gaps with seed defaults", () => {
    const stored = { profile: { displayName: "Sam", username: "sam.rides" } };
    const result = normalizeProfile(stored);
    expect(result.profile.displayName).toBe("Sam");
    expect(result.profile.username).toBe("sam.rides");
    expect(result.profile.email).toBe(seedProfile().profile.email);
    expect(result.privacy.publicProfile).toBe(true);
  });
});

describe("makeFeedback", () => {
  it("trims the message and stamps a time", () => {
    const entry = makeFeedback("issue", "  The map pin is off.  ");
    expect(entry.message).toBe("The map pin is off.");
    expect(entry.kind).toBe("issue");
    expect(Number.isNaN(Date.parse(entry.createdAt))).toBe(false);
  });
});

describe("ridingStats", () => {
  it("derives counts from the live garage and social state", () => {
    const stats = ridingStats(seedGarage(), seedSocial());
    expect(stats.bikeCount).toBe(seedGarage().bikes.length);
    expect(stats.totalMiles).toBe(seedGarage().bikes.reduce((s, g) => s + g.bike.mileage, 0));
    expect(stats.postCount).toBe(0); // seed posts belong to demo riders
    expect(stats.clubCount).toBe(2); // thames-night + surrey-twins include "me"
    expect(stats.followingCount).toBe(1); // seed follows priya
    expect(stats.followerCount).toBe(1);
  });
});
