import { describe, expect, it } from "vitest";
import {
  canJoinRide,
  canManageClub,
  canViewClubContent,
  isClubMember,
  MAX_IMAGE_BYTES,
  ME_ID,
  parseHashtags,
  rideStatus,
  seedSocial,
  validateClub,
  validateImages,
  validatePost,
  validateRide,
  visiblePosts,
} from "@/lib/social";
import type { SocialRide } from "@/types";

const ride = (over: Partial<SocialRide>): SocialRide => ({
  id: "r",
  title: "Test ride",
  description: "",
  meetPoint: "A",
  destination: "B",
  dateTime: new Date(Date.now() + 86_400_000).toISOString(),
  distanceMiles: 40,
  organiserId: "tom",
  participantIds: ["tom"],
  ...over,
});

describe("parseHashtags", () => {
  it("extracts unique lowercase hashtags", () => {
    expect(parseHashtags("Great run #SnakePass #snakepass #Bikes")).toEqual(["snakepass", "bikes"]);
  });
  it("returns none for plain text", () => {
    expect(parseHashtags("no tags here")).toEqual([]);
  });
});

describe("post validation", () => {
  it("rejects empty captions", () => {
    expect(validatePost("   ")).toBeTruthy();
  });
  it("rejects captions over 500 characters", () => {
    expect(validatePost("x".repeat(501))).toBeTruthy();
  });
  it("accepts a normal caption", () => {
    expect(validatePost("Sunday run to Box Hill")).toBeNull();
  });
});

describe("image validation", () => {
  it("rejects non-image types", () => {
    expect(validateImages([{ type: "application/pdf", size: 1000 }])).toBeTruthy();
  });
  it("rejects photos over 2 MB", () => {
    expect(validateImages([{ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 }])).toBeTruthy();
  });
  it("rejects more than 4 photos", () => {
    expect(validateImages(Array.from({ length: 5 }, () => ({ type: "image/jpeg", size: 1000 })))).toBeTruthy();
  });
  it("accepts valid photos", () => {
    expect(validateImages([{ type: "image/png", size: 500_000 }])).toBeNull();
  });
});

describe("club permissions", () => {
  const state = seedSocial();
  const privateClub = state.clubs.find((c) => c.id === "highland-crew")!;
  const publicClub = state.clubs.find((c) => c.id === "thames-night")!;

  it("hides private club content from non-members", () => {
    expect(isClubMember(privateClub, ME_ID)).toBe(false);
    expect(canViewClubContent(privateClub, ME_ID)).toBe(false);
  });
  it("shows private club content to members", () => {
    expect(canViewClubContent(privateClub, "mia")).toBe(true);
  });
  it("shows public club content to everyone", () => {
    expect(canViewClubContent(publicClub, ME_ID)).toBe(true);
  });
  it("only admins and moderators can manage", () => {
    expect(canManageClub(publicClub, "priya")).toBe(true); // admin
    expect(canManageClub(publicClub, "tom")).toBe(true); // moderator
    expect(canManageClub(publicClub, "mia")).toBe(false); // member
    expect(canManageClub(publicClub, ME_ID)).toBe(false);
  });
});

describe("ride status", () => {
  it("is upcoming before the start", () => {
    expect(rideStatus(ride({}))).toBe("upcoming");
  });
  it("is ongoing within four hours of the start", () => {
    expect(rideStatus(ride({ dateTime: new Date(Date.now() - 3_600_000).toISOString() }))).toBe("ongoing");
  });
  it("is completed after the window", () => {
    expect(rideStatus(ride({ dateTime: new Date(Date.now() - 6 * 3_600_000).toISOString() }))).toBe("completed");
  });
  it("cancelled wins over the schedule", () => {
    expect(rideStatus(ride({ cancelled: true }))).toBe("cancelled");
  });
});

describe("canJoinRide", () => {
  it("allows joining an upcoming ride with space", () => {
    expect(canJoinRide(ride({ participantLimit: 5 }), ME_ID)).toBeNull();
  });
  it("blocks joining a full ride", () => {
    expect(canJoinRide(ride({ participantLimit: 2, participantIds: ["tom", "mia"] }), ME_ID)).toBe("This ride is full.");
  });
  it("blocks joining twice", () => {
    expect(canJoinRide(ride({ participantIds: ["tom", ME_ID] }), ME_ID)).toBeTruthy();
  });
  it("blocks joining a completed ride", () => {
    expect(canJoinRide(ride({ dateTime: new Date(Date.now() - 8 * 3_600_000).toISOString() }), ME_ID)).toBeTruthy();
  });
});

describe("ride validation", () => {
  const base = { title: "Sunday run", meetPoint: "Clapham", destination: "Box Hill", dateTime: new Date().toISOString(), distanceMiles: 46 };
  it("accepts a complete ride", () => {
    expect(validateRide(base)).toBeNull();
  });
  it("requires a meeting point and destination", () => {
    expect(validateRide({ ...base, meetPoint: "" })).toBeTruthy();
    expect(validateRide({ ...base, destination: " " })).toBeTruthy();
  });
  it("rejects a participant limit below 2", () => {
    expect(validateRide({ ...base, participantLimit: 1 })).toBeTruthy();
  });
});

describe("club validation", () => {
  it("requires name, description and location", () => {
    expect(validateClub("ab", "d", "l")).toBeTruthy();
    expect(validateClub("Box Hill Crew", "", "Surrey")).toBeTruthy();
    expect(validateClub("Box Hill Crew", "Sunday runs", "")).toBeTruthy();
    expect(validateClub("Box Hill Crew", "Sunday runs", "Surrey")).toBeNull();
  });
});

describe("visiblePosts", () => {
  it("hides posts from blocked riders", () => {
    const state = { ...seedSocial(), blockedIds: ["priya"] };
    expect(visiblePosts(state).some((p) => p.authorId === "priya")).toBe(false);
  });
  it("sorts newest first", () => {
    const posts = visiblePosts(seedSocial());
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1]!.createdAt >= posts[i]!.createdAt).toBe(true);
    }
  });
});
