import { useMemo } from "react";
import {
  makeFeedback,
  normalizeProfile,
  seedProfile,
  validateEmail,
  validateFeedback,
  validateProfile,
} from "@/lib/profile";
import type {
  FeedbackKind,
  NotificationSettings,
  PrivacySettings,
  ProfileSettings,
  ProfileState,
} from "@/types";
import { useLocalStorage } from "./use-local-storage";
import { useSocial } from "./use-social";

/**
 * Rider profile & settings state for the prototype, persisted in
 * localStorage under `throttle:profile`. Profile edits also update the
 * community "me" rider so the feed and profile never disagree.
 */
export function useProfile() {
  const [raw, setRaw] = useLocalStorage<ProfileState>("profile", seedProfile());
  const state = useMemo(() => normalizeProfile(raw), [raw]);
  const social = useSocial();

  const update = (fn: (prev: ProfileState) => ProfileState) => setRaw((prev) => fn(normalizeProfile(prev)));

  return {
    state,

    /** Save profile edits; returns an error message or null. */
    updateProfile: (input: ProfileSettings): string | null => {
      const error = validateProfile(input);
      if (error) return error;
      const cleaned: ProfileSettings = {
        ...input,
        displayName: input.displayName.trim(),
        username: input.username.trim().toLowerCase(),
        bio: input.bio.trim(),
        location: input.location.trim(),
        interests: input.interests.map((i) => i.trim()).filter(Boolean),
        brands: input.brands.map((b) => b.trim()).filter(Boolean),
      };
      update((s) => ({ ...s, profile: cleaned }));
      social.updateMeProfile({
        name: cleaned.displayName,
        username: cleaned.username,
        bio: cleaned.bio,
        location: cleaned.location,
        ...(cleaned.avatarDataUrl ? { avatar: cleaned.avatarDataUrl } : {}),
      });
      return null;
    },

    setAvatar: (dataUrl: string | undefined) => {
      update((s) => ({ ...s, profile: { ...s.profile, avatarDataUrl: dataUrl } }));
      if (dataUrl) social.updateMeProfile({ avatar: dataUrl });
    },

    /** Display-only in the prototype — stored on this device, no account system. */
    updateEmail: (email: string): string | null => {
      const error = validateEmail(email);
      if (error) return error;
      update((s) => ({ ...s, profile: { ...s.profile, email: email.trim() } }));
      return null;
    },

    setPrivacy: (patch: Partial<PrivacySettings>) =>
      update((s) => ({ ...s, privacy: { ...s.privacy, ...patch } })),

    setNotifications: (patch: Partial<NotificationSettings>) =>
      update((s) => ({ ...s, notifications: { ...s.notifications, ...patch } })),

    /** Feedback is stored locally in the prototype — nothing is sent anywhere. */
    sendFeedback: (kind: FeedbackKind, message: string): string | null => {
      const error = validateFeedback(message);
      if (error) return error;
      update((s) => ({ ...s, feedback: [makeFeedback(kind, message), ...s.feedback] }));
      return null;
    },
  };
}
