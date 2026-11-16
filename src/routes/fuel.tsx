import { createFileRoute } from "@tanstack/react-router";
import { FuelPage } from "@/components/pages/fuel-page";

export const Route = createFileRoute("/fuel")({
  head: () => ({
    meta: [
      { title: "Fuel & Map — THROTTLE" },
      { name: "description", content: "Compare sample petrol prices at stations around London." },
      { property: "og:title", content: "Fuel & Map — THROTTLE" },
      { property: "og:description", content: "Compare sample petrol prices at stations around London." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FuelPage,
});
