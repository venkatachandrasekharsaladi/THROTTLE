import { useMemo } from "react";
import {
  canJoinRide,
  canManageClub,
  isClubAdmin,
  isClubMember,
  makeComment,
  makeNotification,
  ME_ID,
  normalizeSocial,
  parseHashtags,
  seedSocial,
  validateClub,
  validatePost,
  validateRide,
} from "@/lib/social";
import { newId } from "@/lib/garage";
import type { PostReport, RiderProfile, SocialClub, SocialPost, SocialRide, SocialState } from "@/types";
import { useLocalStorage } from "./use-local-storage";

/**
 * Community state for the prototype: posts, riders, clubs, rides and
 * notifications persisted in localStorage under `throttle:social`.
 * All permission rules (own content, club roles, ride limits) are enforced
 * in these actions, mirroring what server-side policies would do.
 */
export function useSocial() {
  const [raw, setRaw] = useLocalStorage<SocialState>("social", seedSocial());
  const state = useMemo(() => normalizeSocial(raw), [raw]);

  const update = (fn: (prev: SocialState) => SocialState) => setRaw((prev) => fn(normalizeSocial(prev)));
  const notify = (s: SocialState, n: ReturnType<typeof makeNotification>) => ({
    ...s,
    notifications: [n, ...s.notifications],
  });

  return {
    state,

    /* ----- Posts ----- */
    publishPost: (input: { caption: string; images: string[]; bikeId?: string | undefined; bikeLabel?: string | undefined; location?: string | undefined; clubId?: string | undefined }): string | null => {
      const error = validatePost(input.caption);
      if (error) return error;
      const post: SocialPost = {
        id: newId(),
        authorId: ME_ID,
        caption: input.caption.trim(),
        hashtags: parseHashtags(input.caption),
        images: input.images,
        bikeId: input.bikeId,
        bikeLabel: input.bikeLabel,
        location: input.location?.trim() || undefined,
        clubId: input.clubId,
        createdAt: new Date().toISOString(),
        likedBy: [],
        comments: [],
      };
      update((s) => ({ ...s, posts: [post, ...s.posts] }));
      return null;
    },
    editPost: (postId: string, caption: string, location?: string): string | null => {
      const error = validatePost(caption);
      if (error) return error;
      update((s) => ({
        ...s,
        posts: s.posts.map((p) =>
          p.id === postId && p.authorId === ME_ID
            ? { ...p, caption: caption.trim(), hashtags: parseHashtags(caption), location: location?.trim() || undefined }
            : p,
        ),
      }));
      return null;
    },
    deletePost: (postId: string) =>
      update((s) => ({
        ...s,
        posts: s.posts.filter((p) => !(p.id === postId && p.authorId === ME_ID)),
        savedPostIds: s.savedPostIds.filter((id) => id !== postId),
      })),
    toggleLike: (postId: string) =>
      update((s) => ({
        ...s,
        posts: s.posts.map((p) =>
          p.id === postId
            ? { ...p, likedBy: p.likedBy.includes(ME_ID) ? p.likedBy.filter((id) => id !== ME_ID) : [...p.likedBy, ME_ID] }
            : p,
        ),
      })),
    addComment: (postId: string, body: string, parentId?: string): string | null => {
      if (!body.trim()) return "Write a comment first.";
      update((s) => ({
        ...s,
        posts: s.posts.map((p) =>
          p.id === postId ? { ...p, comments: [...p.comments, makeComment(ME_ID, body.trim(), parentId)] } : p,
        ),
      }));
      return null;
    },
    toggleSave: (postId: string) =>
      update((s) => ({
        ...s,
        savedPostIds: s.savedPostIds.includes(postId)
          ? s.savedPostIds.filter((id) => id !== postId)
          : [...s.savedPostIds, postId],
      })),
    reportPost: (postId: string, reason: string) =>
      update((s) => {
        const report: PostReport = { postId, reason, createdAt: new Date().toISOString() };
        return { ...s, reports: [report, ...s.reports] };
      }),
    blockRider: (riderId: string) =>
      update((s) => ({
        ...s,
        blockedIds: s.blockedIds.includes(riderId) ? s.blockedIds : [...s.blockedIds, riderId],
        followingIds: s.followingIds.filter((id) => id !== riderId),
      })),
    unblockRider: (riderId: string) =>
      update((s) => ({ ...s, blockedIds: s.blockedIds.filter((id) => id !== riderId) })),

    /* ----- Riders ----- */
    /** Keep the community "me" rider in sync with profile edits. */
    updateMeProfile: (patch: Partial<Pick<RiderProfile, "name" | "username" | "bio" | "location" | "avatar">>) =>
      update((s) => ({
        ...s,
        riders: s.riders.map((r) => (r.id === ME_ID ? { ...r, ...patch } : r)),
      })),
    toggleFollow: (riderId: string) =>
      update((s) => {
        const following = s.followingIds.includes(riderId);
        const next = {
          ...s,
          followingIds: following ? s.followingIds.filter((id) => id !== riderId) : [...s.followingIds, riderId],
        };
        return following
          ? next
          : notify(next, makeNotification("follow", `You followed ${s.riders.find((r) => r.id === riderId)?.name ?? "a rider"}.`));
      }),

    /* ----- Clubs ----- */
    createClub: (input: { name: string; description: string; location: string; isPrivate: boolean }): string | null => {
      const error = validateClub(input.name, input.description, input.location);
      if (error) return error;
      const club: SocialClub = {
        id: newId(),
        name: input.name.trim(),
        description: input.description.trim(),
        location: input.location.trim(),
        isPrivate: input.isPrivate,
        adminIds: [ME_ID],
        moderatorIds: [],
        memberIds: [ME_ID],
        announcements: [],
        createdAt: new Date().toISOString(),
      };
      update((s) => ({ ...s, clubs: [club, ...s.clubs] }));
      return null;
    },
    joinClub: (clubId: string) =>
      update((s) => ({
        ...s,
        clubs: s.clubs.map((c) =>
          c.id === clubId && !c.memberIds.includes(ME_ID) ? { ...c, memberIds: [...c.memberIds, ME_ID] } : c,
        ),
      })),
    leaveClub: (clubId: string) =>
      update((s) => ({
        ...s,
        clubs: s.clubs.map((c) =>
          c.id === clubId
            ? {
                ...c,
                memberIds: c.memberIds.filter((id) => id !== ME_ID),
                adminIds: c.adminIds.filter((id) => id !== ME_ID),
                moderatorIds: c.moderatorIds.filter((id) => id !== ME_ID),
              }
            : c,
        ),
      })),
    removeMember: (clubId: string, riderId: string) =>
      update((s) => ({
        ...s,
        clubs: s.clubs.map((c) =>
          c.id === clubId && isClubAdmin(c, ME_ID) && !isClubAdmin(c, riderId)
            ? { ...c, memberIds: c.memberIds.filter((id) => id !== riderId), moderatorIds: c.moderatorIds.filter((id) => id !== riderId) }
            : c,
        ),
      })),
    toggleModerator: (clubId: string, riderId: string) =>
      update((s) => ({
        ...s,
        clubs: s.clubs.map((c) =>
          c.id === clubId && isClubAdmin(c, ME_ID) && c.memberIds.includes(riderId) && !isClubAdmin(c, riderId)
            ? {
                ...c,
                moderatorIds: c.moderatorIds.includes(riderId)
                  ? c.moderatorIds.filter((id) => id !== riderId)
                  : [...c.moderatorIds, riderId],
              }
            : c,
        ),
      })),
    addAnnouncement: (clubId: string, body: string): string | null => {
      if (!body.trim()) return "Write an announcement first.";
      update((s) => ({
        ...s,
        clubs: s.clubs.map((c) =>
          c.id === clubId && canManageClub(c, ME_ID)
            ? { ...c, announcements: [{ id: newId(), authorId: ME_ID, body: body.trim(), createdAt: new Date().toISOString() }, ...c.announcements] }
            : c,
        ),
      }));
      return null;
    },

    /* ----- Rides ----- */
    createRide: (input: {
      title: string;
      description: string;
      meetPoint: string;
      destination: string;
      dateTime: string;
      routeInfo?: string | undefined;
      distanceMiles: number;
      participantLimit?: number | undefined;
      clubId?: string | undefined;
    }): string | null => {
      const error = validateRide(input);
      if (error) return error;
      const ride: SocialRide = {
        id: newId(),
        title: input.title.trim(),
        description: input.description.trim(),
        meetPoint: input.meetPoint.trim(),
        destination: input.destination.trim(),
        dateTime: new Date(input.dateTime).toISOString(),
        routeInfo: input.routeInfo?.trim() || undefined,
        distanceMiles: input.distanceMiles,
        participantLimit: input.participantLimit,
        organiserId: ME_ID,
        participantIds: [ME_ID],
        clubId: input.clubId,
      };
      update((s) => notify({ ...s, rides: [ride, ...s.rides] }, makeNotification("ride_update", `Your ride “${ride.title}” is listed.`)));
      return null;
    },
    joinRide: (rideId: string): string | null => {
      let result: string | null = null;
      update((s) => {
        const ride = s.rides.find((r) => r.id === rideId);
        if (!ride) return s;
        const error = canJoinRide(ride, ME_ID);
        if (error) {
          result = error;
          return s;
        }
        return { ...s, rides: s.rides.map((r) => (r.id === rideId ? { ...r, participantIds: [...r.participantIds, ME_ID] } : r)) };
      });
      return result;
    },
    leaveRide: (rideId: string) =>
      update((s) => ({
        ...s,
        rides: s.rides.map((r) =>
          r.id === rideId && r.organiserId !== ME_ID
            ? { ...r, participantIds: r.participantIds.filter((id) => id !== ME_ID) }
            : r,
        ),
      })),
    cancelRide: (rideId: string) =>
      update((s) => {
        const ride = s.rides.find((r) => r.id === rideId);
        if (!ride || ride.organiserId !== ME_ID) return s;
        return notify(
          { ...s, rides: s.rides.map((r) => (r.id === rideId ? { ...r, cancelled: true } : r)) },
          makeNotification("ride_update", `Your ride “${ride.title}” was cancelled.`),
        );
      }),

    /* ----- Notifications ----- */
    markRead: (id: string) =>
      update((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    markAllRead: () => update((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

    /* ----- Derived ----- */
    isMember: (club: SocialClub) => isClubMember(club, ME_ID),
    canManage: (club: SocialClub) => canManageClub(club, ME_ID),
  };
}
