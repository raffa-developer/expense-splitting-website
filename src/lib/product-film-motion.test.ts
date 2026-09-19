import { describe, expect, it } from "vitest";
import { coinSegmentAngles } from "@/three/product-film/coin";
import {
  clampOrbit,
  getProductFilmState,
  screenCrossfade
} from "./product-film-motion";

describe("product-film motion", () => {
  it("opens coin arcs only during the share chapter", () => {
    expect(getProductFilmState(0.05, false, false).coin.open).toBe(0);
    expect(getProductFilmState(0.22, false, false).coin.open).toBeGreaterThan(0);
    expect(getProductFilmState(0.53, false, false).coin.open).toBe(0);
  });

  it("constrains drag orbit to the composed camera limits", () => {
    expect(clampOrbit({ azimuth: 1, elevation: -1 })).toEqual({
      azimuth: 10 * Math.PI / 180,
      elevation: -5 * Math.PI / 180
    });
  });

  it("makes neighboring screenshot opacities complementary", () => {
    const values = screenCrossfade(1.2, 3, 0.35);
    expect(values[1]! + values[2]!).toBeCloseTo(1, 5);
  });

  it("partitions a complete coin into four non-overlapping arcs", () => {
    const arcs = coinSegmentAngles([0.4, 0.25, 0.2, 0.15]);
    expect(arcs).toHaveLength(4);
    expect(arcs[0]!.start).toBeCloseTo(0);
    expect(arcs.at(-1)?.end).toBeCloseTo(Math.PI * 2);
  });
});
