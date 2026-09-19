import { describe, expect, it } from "vitest";
import { allocateEqual, allocateWeights } from "@/lib/split";
import { formatCents } from "@/lib/money";

describe("allocate", () => {
  it("hands the leftover cent to the first share", () => {
    const shares = allocateEqual(10000, 3);
    expect(shares.map((share) => share.cents)).toEqual([3334, 3333, 3333]);
    expect(shares.map((share) => share.extra)).toEqual([true, false, false]);
    expect(shares.reduce((sum, share) => sum + share.cents, 0)).toBe(10000);
  });

  it("splits evenly when the total divides", () => {
    const shares = allocateEqual(12000, 4);
    expect(shares.map((share) => share.cents)).toEqual([3000, 3000, 3000, 3000]);
    expect(shares.some((share) => share.extra)).toBe(false);
  });

  it("follows percentage weights without losing cents", () => {
    const shares = allocateWeights(10000, [40, 35, 25]);
    expect(shares.map((share) => share.cents)).toEqual([4000, 3500, 2500]);
    expect(shares.reduce((sum, share) => sum + share.cents, 0)).toBe(10000);
  });

  it("follows weighted shares without losing cents", () => {
    const shares = allocateWeights(10000, [2, 1, 1]);
    expect(shares.map((share) => share.cents)).toEqual([5000, 2500, 2500]);
  });

  it("keeps a three-way split of one euro exact", () => {
    const shares = allocateWeights(100, [1, 1, 1]);
    expect(shares.map((share) => share.cents)).toEqual([34, 33, 33]);
    expect(shares.reduce((sum, share) => sum + share.cents, 0)).toBe(100);
  });
});

describe("formatCents", () => {
  it("renders euros for each locale", () => {
    expect(formatCents(4060, "pt-PT")).toContain("40,60");
    expect(formatCents(4060, "en")).toContain("40.60");
  });
});
