import { describe, it, expect } from 'vitest';
import { PALETTE, EMBED_DIM, generateTransmission, type Token } from './transmissions';

describe('transmissions — palette schema', () => {
	it('has at least 14 entries', () => {
		expect(PALETTE.length).toBeGreaterThanOrEqual(14);
	});

	it('every entry has a non-empty word, an embedding of EMBED_DIM, and a valid type', () => {
		for (const t of PALETTE) {
			expect(t.word.length).toBeGreaterThan(0);
			expect(t.embedding.length).toBe(EMBED_DIM);
			expect(['tactical', 'personal']).toContain(t.type);
		}
	});

	it('has both tactical and personal entries (mixed message types)', () => {
		const tactical = PALETTE.filter((t) => t.type === 'tactical');
		const personal = PALETTE.filter((t) => t.type === 'personal');
		expect(tactical.length).toBeGreaterThanOrEqual(5);
		expect(personal.length).toBeGreaterThanOrEqual(5);
	});

	it('same-type cosine similarity exceeds cross-type cosine similarity (clusters separate)', () => {
		// Average within-type vs between-type cosine similarity.
		const cos = (a: readonly number[], b: readonly number[]) => {
			let dot = 0;
			let na = 0;
			let nb = 0;
			for (let i = 0; i < a.length; i++) {
				dot += a[i] * b[i];
				na += a[i] * a[i];
				nb += b[i] * b[i];
			}
			return dot / (Math.sqrt(na) * Math.sqrt(nb));
		};
		const tactical = PALETTE.filter((t: Token) => t.type === 'tactical');
		const personal = PALETTE.filter((t: Token) => t.type === 'personal');

		const within = (group: Token[]) => {
			let s = 0;
			let n = 0;
			for (let i = 0; i < group.length; i++)
				for (let j = i + 1; j < group.length; j++) {
					s += cos(group[i].embedding, group[j].embedding);
					n++;
				}
			return n > 0 ? s / n : 0;
		};
		const between = () => {
			let s = 0;
			let n = 0;
			for (const a of tactical)
				for (const b of personal) {
					s += cos(a.embedding, b.embedding);
					n++;
				}
			return n > 0 ? s / n : 0;
		};

		expect(within(tactical)).toBeGreaterThan(between());
		expect(within(personal)).toBeGreaterThan(between());
	});
});

describe('transmissions — generateTransmission', () => {
	it('returns exactly T words from the palette', () => {
		const T = 7;
		const out = generateTransmission(PALETTE, T, 42);
		expect(out.length).toBe(T);
		const palWords = new Set(PALETTE.map((p) => p.word));
		for (const w of out) expect(palWords.has(w)).toBe(true);
	});

	it('is deterministic for fixed seed', () => {
		const a = generateTransmission(PALETTE, 10, 1234);
		const b = generateTransmission(PALETTE, 10, 1234);
		expect(a).toEqual(b);
	});

	it('produces different sequences for different seeds', () => {
		const a = generateTransmission(PALETTE, 10, 1);
		const b = generateTransmission(PALETTE, 10, 2);
		expect(a).not.toEqual(b);
	});
});
