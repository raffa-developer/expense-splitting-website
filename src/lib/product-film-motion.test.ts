import { describe, expect, it } from "vitest";
import { applyScreenOpacities } from "@/three/product-film/laptop";
import { STUDIO_PALETTE, STAGE_LOOKS } from "@/three/product-film/studio";
import { THEME_CANVAS } from "@/lib/theme";
import {
  clampOrbit,
  getProductFilmState,
  productFilmCaptionKey,
  screenCrossfade
} from "./product-film-motion";

describe("product-film motion", () => {
  it("ramps the settle outro between 0.88 and 0.98", () => {
    expect(getProductFilmState(0.5, false, false).settled).toBe(0);
    expect(getProductFilmState(0.88, false, false).settled).toBe(0);
    expect(getProductFilmState(0.93, false, false).settled).toBeGreaterThan(0);
    expect(getProductFilmState(1, false, false).settled).toBe(1);
  });

  it("opens the laptop during the share chapter, then crossfades its screens", () => {
    const closed = getProductFilmState(0.12, false, false);
    expect(closed.laptop.open).toBe(0);
    expect(getProductFilmState(0.3, false, false).laptop.open).toBe(1);
    expect(closed.laptop.screen).toBe(0);
    expect(getProductFilmState(0.5, false, false).laptop.screen).toBe(2);
  });

  it("rotates the phone then reveals its screens from 0.55 to 0.8", () => {
    const early = getProductFilmState(0.55, false, false);
    expect(early.phone.rotation).toBe(0);
    expect(
      getProductFilmState(0.68, false, false).phone.rotation
    ).toBeCloseTo(Math.PI * 2, 5);
    expect(early.phone.screen).toBe(0);
    expect(getProductFilmState(0.8, false, false).phone.screen).toBe(2);
  });

  it("moves focus from laptop to phone after the product handoff", () => {
    const laptop = getProductFilmState(0.45, false, false);
    const phone = getProductFilmState(0.7, false, false);
    expect(laptop.activeDevice).toBe("laptop");
    expect(phone.activeDevice).toBe("phone");
  });

  it("selects a caption for every film chapter", () => {
    expect(productFilmCaptionKey(0.1)).toBe("film.share");
    expect(productFilmCaptionKey(0.4)).toBe("film.laptop");
    expect(productFilmCaptionKey(0.7)).toBe("film.phone");
    expect(productFilmCaptionKey(0.95)).toBe("film.settle");
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

  it("writes no opacity outside the zero-to-one range", () => {
    const target = [{ opacity: 0 }, { opacity: 0 }];
    applyScreenOpacities(target, [1.2, -0.2]);
    expect(target).toEqual([{ opacity: 1 }, { opacity: 0 }]);
  });

  it("uses the prescribed studio palette", () => {
    expect(STUDIO_PALETTE.settleGreen).toBe("#72e1b1");
    expect(STUDIO_PALETTE.studioBlack).toBe("#080b10");
  });

  it("keeps the stage free of the old blue studio tint", () => {
    for (const theme of ["light", "dark"] as const) {
      const look = STAGE_LOOKS[theme];
      expect(look.rim).not.toBe("#4f7fd6");
      expect(look.accentReflection).not.toContain("141, 191, 255");
    }
    const dark = STAGE_LOOKS.dark;
    const channel = (hex: string, index: number) =>
      parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
    expect(channel(dark.rim, 1)).toBeGreaterThan(channel(dark.rim, 2));
    expect(channel(dark.floor, 0)).toBeGreaterThan(channel(dark.floor, 2));
    expect(channel(dark.background, 0)).toBeGreaterThan(
      channel(dark.background, 2)
    );
  });

  it("keeps the stage background identical to the page canvas", () => {
    for (const theme of ["light", "dark"] as const) {
      expect(STAGE_LOOKS[theme].background).toBe(THEME_CANVAS[theme]);
      expect(STAGE_LOOKS[theme].fog).toBe(THEME_CANVAS[theme]);
    }
  });
});
