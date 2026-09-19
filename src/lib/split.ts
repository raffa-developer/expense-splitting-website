export interface Allocation {
  cents: number;
  extra: boolean;
}

function distribute(total: number, weights: readonly number[]): Allocation[] {
  const sum = weights.reduce((running, weight) => running + weight, 0);
  if (!Number.isInteger(total) || total < 0 || sum <= 0) {
    throw new Error("allocation needs a non-negative integer total and weights");
  }

  const floors = weights.map((weight) =>
    Math.floor((total * weight) / sum)
  );
  const base = [...floors];
  let rest = total - floors.reduce((running, cents) => running + cents, 0);

  const byRemainder = weights
    .map((weight, index) => ({ index, remainder: (total * weight) % sum }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (const candidate of byRemainder) {
    if (rest <= 0) break;
    floors[candidate.index] = (floors[candidate.index] ?? 0) + 1;
    rest -= 1;
  }

  return floors.map((cents, index) => ({
    cents,
    extra: cents > (base[index] ?? cents)
  }));
}

export function allocateEqual(total: number, parts: number): Allocation[] {
  return distribute(
    total,
    Array.from({ length: parts }, () => 1)
  );
}

export function allocateWeights(
  total: number,
  weights: readonly number[]
): Allocation[] {
  return distribute(total, weights);
}
