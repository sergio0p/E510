// mulberry32 — small, fast, deterministic PRNG.
// Public domain. Seed is a 32-bit unsigned int.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle using a provided PRNG.
// Returns a new array; does not mutate the input.
export function shuffleWithPrng(arr, prng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Convenience: shuffle by integer seed.
export function shuffleWithSeed(arr, seed) {
  return shuffleWithPrng(arr, mulberry32(seed));
}

// Generate a fresh random seed in [0, 2^32).
export function randomSeed() {
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}
