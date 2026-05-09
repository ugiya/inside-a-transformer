/**
 * Deterministic seeded PRNG (mulberry32).
 *
 * Vendored to avoid a dependency. Same seed -> same number stream, byte-for-byte,
 * across runs and platforms. Used by `weights.initWeights`,
 * `transmissions.generateTransmission`, and `recall-test.generateQuestions`
 * to make the entire game reproducible from a single seed.
 *
 * Reference: https://gist.github.com/tommyettinger/46a3b38ba6f8e62cad2c1d0f4a18b21f
 */
export function mulberry32(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = (s + 0x6d2b79f5) >>> 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
