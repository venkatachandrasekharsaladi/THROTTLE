import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/pages/settings-page";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — THROTTLE" },
      { name: "description", content: "Account, privacy, notifications, appearance, security and support settings." },
      { property: "og:title", content: "Settings — THROTTLE" },
      { property: "og:description", content: "Account, privacy, notifications, appearance, security and support settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});
