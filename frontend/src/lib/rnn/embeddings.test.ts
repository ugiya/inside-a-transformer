import { describe, it, expect } from 'vitest';
import { getEmbedding } from './embeddings';
import { PALETTE } from './transmissions';

describe('embeddings — palette lookup', () => {
	it('returns the correct embedding for every palette word', () => {
		for (const t of PALETTE) {
			const e = getEmbedding(t.word);
			expect(e).toEqual(t.embedding);
		}
	});

	it('throws on unknown word', () => {
		expect(() => getEmbedding('not-in-palette')).toThrow();
	});

	it('lookup is independent of palette order (custom palette parameter)', () => {
		const customPalette = [
			{ word: 'foo', embedding: [1, 2, 3, 4], type: 'tactical' as const },
			{ word: 'bar', embedding: [5, 6, 7, 8], type: 'personal' as const }
		];
		expect(getEmbedding('foo', customPalette)).toEqual([1, 2, 3, 4]);
		expect(getEmbedding('bar', customPalette)).toEqual([5, 6, 7, 8]);
	});
});
