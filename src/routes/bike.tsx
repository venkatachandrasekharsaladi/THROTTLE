import { createFileRoute } from "@tanstack/react-router";
import { BikePage } from "@/components/pages/bike-page";

export const Route = createFileRoute("/bike")({
  head: () => ({
    meta: [
      { title: "My Bike — THROTTLE" },
      { name: "description", content: "Bike details, maintenance, service history, fuel costs and documents." },
      { property: "og:title", content: "My Bike — THROTTLE" },
      { property: "og:description", content: "Bike details, maintenance, service history, fuel costs and documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BikePage,
});
