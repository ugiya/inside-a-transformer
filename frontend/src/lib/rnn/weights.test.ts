import { describe, it, expect } from 'vitest';
import { initWeights } from './weights';

describe('weights — deterministic initialisation', () => {
	it('returns shape-correct Wx, Wh, b for given N and embedDim', () => {
		const N = 12;
		const embedDim = 4;
		const w = initWeights(N, embedDim, 42);

		expect(w.Wx.length).toBe(N);
		for (const row of w.Wx) expect(row.length).toBe(embedDim);

		expect(w.Wh.length).toBe(N);
		for (const row of w.Wh) expect(row.length).toBe(N);

		expect(w.b.length).toBe(N);
	});

	it('is deterministic for fixed seed (same seed -> same weights byte-for-byte)', () => {
		const a = initWeights(8, 4, 1234);
		const b = initWeights(8, 4, 1234);

		expect(JSON.stringify(a)).toBe(JSON.stringify(b));
	});

	it('produces different weights for different seeds', () => {
		const a = initWeights(8, 4, 1);
		const b = initWeights(8, 4, 2);

		expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
	});

	it('keeps weights small (|w| < 1) so the simple RNN does not explode immediately', () => {
		const w = initWeights(32, 4, 999);
		const all: number[] = [
			...w.Wx.flat(),
			...w.Wh.flat(),
			...w.b
		];
		for (const v of all) {
			expect(Math.abs(v)).toBeLessThan(1);
		}
	});
});
