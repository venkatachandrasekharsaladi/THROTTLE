import { describe, expect, it } from "vitest";
import { motorcycle, rider, fuelStations } from "@/data/demo";
import { formatGbp, formatMiles } from "@/lib/format";
import { filterStations } from "@/components/pages/fuel-page";

describe("UK demo rider", () => {
  it("is Alex Morgan in London", () => {
    expect(rider.name).toBe("Alex Morgan");
    expect(rider.location).toBe("London, United Kingdom");
  });
  it("rides a 2022 Yamaha MT-07 'Shadow', 689cc, 12,450 miles", () => {
    expect([motorcycle.year, motorcycle.make, motorcycle.model, motorcycle.nickname]).toEqual([2022, "Yamaha", "MT-07", "Shadow"]);
    expect(motorcycle.engineCc).toBe(689);
    expect(motorcycle.mileage).toBe(12450);
  });
});

describe("UK units", () => {
  it("formats currency in GBP", () => expect(formatGbp(412.6)).toBe("£412.60"));
  it("formats distance in miles", () => expect(formatMiles(12450)).toBe("12,450 mi"));
});

describe("fuel filters", () => {
  it("open 24h + bike parking leaves only Vauxhall", () => {
    expect(filterStations(fuelStations, "", ["open24", "bikeParking"]).map((s) => s.id)).toEqual(["vauxhall"]);
  });
  it("returns nothing for an unknown area", () => {
    expect(filterStations(fuelStations, "Manchester", [])).toHaveLength(0);
  });
});
