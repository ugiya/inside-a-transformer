import { describe, it, expect } from 'vitest';
import { CANONICAL_FREQS, CIRCUITS, topNeuronsForFrequency } from './fourier-finale';

describe('fourier-finale data', () => {
	it('exposes all 5 canonical frequencies', () => {
		expect(CANONICAL_FREQS).toEqual([14, 35, 41, 42, 52]);
	});

	it('exposes one circuit per canonical frequency', () => {
		expect(CIRCUITS).toHaveLength(5);
		const ks = CIRCUITS.map((c) => c.k);
		expect(ks).toEqual([14, 35, 41, 42, 52]);
	});

	it('every circuit has a non-empty motif and roomOfOrigin', () => {
		for (const c of CIRCUITS) {
			expect(c.motif.length).toBeGreaterThan(0);
			expect(c.roomOfOrigin.length).toBeGreaterThan(0);
			expect(c.caption.length).toBeGreaterThan(0);
		}
	});
});

describe('topNeuronsForFrequency', () => {
	const neurons = [
		{ idx: 0, coefficients: [0.1, 0.2, 0.3, 0.4, 0.5] },
		{ idx: 1, coefficients: [0.9, 0.1, 0.0, 0.0, 0.0] },
		{ idx: 2, coefficients: [0.5, 0.5, 0.5, 0.5, 0.5] },
		{ idx: 3, coefficients: [0.0, 0.9, 0.0, 0.0, 0.0] },
		{ idx: 4, coefficients: [0.7, 0.7, 0.7, 0.7, 0.7] },
		{ idx: 5, coefficients: [0.3, 0.3, 0.3, 0.3, 0.3] }
	];

	it('returns top-K by descending coefficient at the given freq column', () => {
		const top = topNeuronsForFrequency(neurons, 0, 3);
		expect(top.map((t) => t.idx)).toEqual([1, 4, 2]);
	});

	it('different frequencies yield different rankings', () => {
		const k0 = topNeuronsForFrequency(neurons, 0, 1);
		const k1 = topNeuronsForFrequency(neurons, 1, 1);
		expect(k0[0].idx).toBe(1);
		expect(k1[0].idx).toBe(3);
	});

	it('does not mutate the input array', () => {
		const before = neurons.map((n) => n.idx);
		topNeuronsForFrequency(neurons, 2, 5);
		const after = neurons.map((n) => n.idx);
		expect(after).toEqual(before);
	});
});
