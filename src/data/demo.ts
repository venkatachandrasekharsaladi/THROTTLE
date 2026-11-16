/**
 * THROTTLE demonstration data. Every value here is fictional sample data
 * for the UK prototype — no live services are connected.
 */
import bikeImage from "@/assets/bike-mt07.jpg";
import riderImage from "@/assets/rider-alex.jpg";
import snakePassImage from "@/assets/post-snake-pass.jpg";
import cafeImage from "@/assets/post-cafe.jpg";
import type {
  BikeDocument,
  Club,
  CommunityPost,
  FuelStation,
  FuelSummary,
  MaintenanceItem,
  Motorcycle,
  RideEvent,
  Rider,
  RouteSuggestion,
  ServiceRecord,
} from "@/types";

export const DEMO_LABEL = "Demo data";

export const rider: Rider = {
  id: "alex-morgan",
  name: "Alex Morgan",
  firstName: "Alex",
  location: "London, United Kingdom",
  memberSince: 2024,
  avatar: riderImage,
};

export const motorcycle: Motorcycle = {
  id: "shadow",
  year: 2022,
  make: "Yamaha",
  model: "MT-07",
  nickname: "Shadow",
  engineCc: 689,
  engineType: "CP2 parallel-twin",
  power: "73.4 PS @ 8,750 rpm",
  kerbWeightKg: 184,
  registration: "LK22 MTO",
  colour: "Tech Black",
  mileage: 12450,
  image: bikeImage,
};

export const maintenance: MaintenanceItem[] = [
  {
    id: "chain",
    title: "Chain clean & adjust",
    detail: "Clean, lube and set slack to 50–55 mm.",
    dueInMiles: 150,
    dueLabel: "Due in 150 mi",
    status: "urgent",
  },
  {
    id: "tyres",
    title: "Tyre pressure check",
    detail: "Front 36 psi · Rear 42 psi (solo, cold).",
    dueLabel: "Weekly",
    status: "due",
  },
  {
    id: "oil",
    title: "Engine oil & filter",
    detail: "Next interval at 16,000 mi.",
    dueInMiles: 3550,
    dueLabel: "Due in 3,550 mi",
    status: "good",
  },
];

export const serviceHistory: ServiceRecord[] = [
  {
    id: "s3",
    title: "Major service · valve clearance check",
    workshop: "Thames Moto Workshop, Battersea",
    mileage: 11800,
    date: "2026-09-12",
    costGbp: 385,
  },
  {
    id: "s2",
    title: "New tyres · Michelin Road 6",
    workshop: "Southside Tyres, Croydon",
    mileage: 9650,
    date: "2026-04-03",
    costGbp: 289.5,
  },
  {
    id: "s1",
    title: "Minor service · oil & filter",
    workshop: "Thames Moto Workshop, Battersea",
    mileage: 6020,
    date: "2025-10-18",
    costGbp: 165,
  },
];

export const fuelSummary: FuelSummary = {
  averageMpg: 58.4,
  fuelGrade: "Super E5",
  seasonSpendGbp: 412.6,
  lastFillLitres: 11.8,
  lastFillGbp: 18.53,
};

export const documents: BikeDocument[] = [
  {
    id: "mot",
    title: "MOT certificate",
    type: "MOT certificate",
    detail: "Valid until 14 Mar 2027",
    expiryDate: "2027-03-14",
  },
  {
    id: "insurance",
    title: "Insurance · fully comprehensive",
    type: "Insurance",
    detail: "Renews 2 Jun 2027",
    expiryDate: "2027-06-02",
  },
  {
    id: "tax",
    title: "Vehicle tax (VED)",
    type: "Other",
    detail: "Taxed until 31 Jul 2027",
    expiryDate: "2027-07-31",
  },
  {
    id: "v5c",
    title: "V5C logbook",
    type: "Other",
    detail: "Digital copy saved",
  },
];

export const fuelStations: FuelStation[] = [
  {
    id: "vauxhall",
    brand: "Esso",
    name: "Vauxhall Bridge Road",
    area: "Pimlico",
    postcode: "SW1V",
    distanceMiles: 0.8,
    e10PricePence: 139.9,
    e5PricePence: 157.9,
    updatedLabel: "Sample price",
    open24: true,
    bikeParking: true,
    amenities: ["Air & tyre gauge", "Shop", "Card at pump"],
    mapX: 46,
    mapY: 56,
  },
  {
    id: "kennington",
    brand: "Shell",
    name: "Kennington Lane",
    area: "Kennington",
    postcode: "SE11",
    distanceMiles: 1.4,
    e10PricePence: 142.9,
    e5PricePence: 162.9,
    updatedLabel: "Sample price",
    open24: true,
    bikeParking: false,
    amenities: ["Shop", "Car wash"],
    mapX: 63,
    mapY: 68,
  },
  {
    id: "battersea",
    brand: "BP",
    name: "Battersea Park Road",
    area: "Battersea",
    postcode: "SW8",
    distanceMiles: 1.9,
    e10PricePence: 137.9,
    e5PricePence: 155.9,
    updatedLabel: "Sample price",
    open24: false,
    bikeParking: true,
    amenities: ["Air & tyre gauge", "Coffee"],
    mapX: 30,
    mapY: 74,
  },
  {
    id: "kings-road",
    brand: "Texaco",
    name: "King's Road",
    area: "Chelsea",
    postcode: "SW10",
    distanceMiles: 2.3,
    e10PricePence: 145.9,
    e5PricePence: 165.9,
    updatedLabel: "Sample price",
    open24: false,
    bikeParking: false,
    amenities: ["Shop"],
    mapX: 18,
    mapY: 44,
  },
];

export const posts: CommunityPost[] = [
  {
    id: "p1",
    authorName: "Priya S.",
    authorInitials: "PS",
    bike: "2023 Triumph Tiger 900 GT",
    location: "Snake Pass, Peak District",
    timeLabel: "2h ago",
    body: "Cold, clear and quiet on the A57 this morning. Moorland all to ourselves before the cyclists arrived. Heated grips earned their keep.",
    image: snakePassImage,
    likes: 48,
    comments: 12,
  },
  {
    id: "p2",
    authorName: "Tom H.",
    authorInitials: "TH",
    bike: "2019 Triumph Thruxton RS",
    location: "North Devon coast",
    timeLabel: "5h ago",
    body: "Bacon roll, sea view, wet roads. Perfect end to the coast run — chain cleaned before the ride home.",
    image: cafeImage,
    likes: 35,
    comments: 8,
  },
];

export const clubs: Club[] = [
  {
    id: "thames-night",
    name: "Thames Night Riders",
    area: "Central London",
    members: 412,
    description: "Late-evening city loops along the river and Embankment.",
  },
  {
    id: "surrey-twins",
    name: "Surrey Hills Twins Club",
    area: "Surrey",
    members: 186,
    description: "Parallel and V-twin owners. Sunday breakfast runs.",
  },
  {
    id: "north-circ",
    name: "North Circular Commuters",
    area: "North London",
    members: 958,
    description: "Year-round commuters sharing routes, kit and roadworks news.",
  },
];

export const myClubIds = ["thames-night", "surrey-twins"];

export const rides: RideEvent[] = [
  {
    id: "box-hill",
    title: "Box Hill Sunday Breakfast Run",
    type: "Group ride",
    dateLabel: "Sun 8 Nov · 08:00",
    meetPoint: "Box Hill viewpoint, Surrey",
    description:
      "Steady pace from Clapham via the A24. Breakfast at the top, back by noon. All bikes welcome.",
    ridersConfirmed: 14,
    clubId: "surrey-twins",
    distanceMiles: 46,
  },
  {
    id: "embankment",
    title: "Embankment Night Loop",
    type: "City ride",
    dateLabel: "Thu 12 Nov · 19:30",
    meetPoint: "Chelsea Bridge, SW1",
    description: "A relaxed lap of the river bridges with a tea stop in Hackney.",
    ridersConfirmed: 9,
    clubId: "thames-night",
    distanceMiles: 22,
  },
];

export const completedRides = 18;

export const routes: RouteSuggestion[] = [
  { id: "r1", name: "Snake Pass", road: "A57", region: "Peak District", lengthMiles: 26 },
  { id: "r2", name: "Cheddar Gorge", road: "B3135", region: "Somerset", lengthMiles: 9 },
  { id: "r3", name: "Surrey Hills Loop", road: "A25 / B2126", region: "Surrey", lengthMiles: 38 },
  { id: "r4", name: "Horseshoe Pass", road: "A542", region: "Denbighshire", lengthMiles: 12 },
];
