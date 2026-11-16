import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/pages/profile-page";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Rider Profile — THROTTLE" },
      { name: "description", content: "Your bikes, clubs, rides and settings." },
      { property: "og:title", content: "Rider Profile — THROTTLE" },
      { property: "og:description", content: "Your bikes, clubs, rides and settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});
