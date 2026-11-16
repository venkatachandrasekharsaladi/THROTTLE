import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/pages/home-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — THROTTLE" },
      { name: "description", content: "Your MT-07, mileage, maintenance and next group ride at a glance." },
      { property: "og:title", content: "Home — THROTTLE" },
      { property: "og:description", content: "Your MT-07, mileage, maintenance and next group ride at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});
