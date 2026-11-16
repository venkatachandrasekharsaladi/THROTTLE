import { createFileRoute } from "@tanstack/react-router";
import { CommunityPage } from "@/components/pages/community-page";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — THROTTLE" },
      { name: "description", content: "Rider posts, UK routes, clubs and upcoming group rides." },
      { property: "og:title", content: "Community — THROTTLE" },
      { property: "og:description", content: "Rider posts, UK routes, clubs and upcoming group rides." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityPage,
});
