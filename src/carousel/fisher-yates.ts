// GENESIS-TRIBUNAL — Fisher-Yates per-vote shuffle
// DIAMOND 3 from Spark #045 Round 1.
// Cryptographically random selection of 3 providers from the pool of 8.
// Per-vote shuffle (not per-day) for maximum adversary inference resistance.

import * as crypto from "crypto";

// Cryptographic Fisher-Yates shuffle of an array.
// Uses crypto.randomInt for unbiased index selection.
export function fisherYatesShuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Select N elements from a pool, with optional exclusion predicate.
// Returns the first N elements after shuffling that pass the predicate.
export function selectN<T>(
  pool: readonly T[],
  n: number,
  exclude?: (item: T) => boolean
): T[] {
  if (n > pool.length) {
    throw new Error(`cannot select ${n} from pool of ${pool.length}`);
  }
  const shuffled = fisherYatesShuffle(pool);
  const selected: T[] = [];
  for (const item of shuffled) {
    if (exclude && exclude(item)) continue;
    selected.push(item);
    if (selected.length === n) break;
  }
  if (selected.length < n) {
    throw new Error(`could not select ${n} non-excluded items from pool`);
  }
  return selected;
}
