import { useLocalStorage, useStoredSet } from "./use-local-storage";
import type { CommunityPost } from "@/types";

/** Prototype persistence keys, shared so every page sees the same state. */
export const useLoggedMaintenance = () => useStoredSet("maintenance-done");
export const useLikedPosts = () => useStoredSet("liked-posts");
export const useSavedPosts = () => useStoredSet("saved-posts");
export const useRidesGoing = () => useStoredSet("rides-going");
export const useMyPosts = () => useLocalStorage<CommunityPost[]>("my-posts", []);
export const useNotifications = () => useLocalStorage<boolean>("notifications", true);
