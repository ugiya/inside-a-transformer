import { describe, it, expect } from 'vitest';
import { primerManifest, getPrimer, type PrimerEntry } from './primer-manifest';

const REQUIRED_TERMS = [
	'logits',
	'softmax',
	'cross-entropy',
	'weight decay',
	'activation patching'
] as const;

describe('primer-manifest', () => {
	it('exports exactly 5 entries', () => {
		expect(primerManifest).toHaveLength(5);
	});

	it('contains every required term', () => {
		const terms = primerManifest.map((e: PrimerEntry) => e.term);
		for (const t of REQUIRED_TERMS) {
			expect(terms).toContain(t);
		}
	});

	it('every entry has a non-empty headline', () => {
		for (const entry of primerManifest) {
			expect(typeof entry.headline).toBe('string');
			expect(entry.headline.length).toBeGreaterThan(0);
		}
	});

	it('every entry defines both a body and an interaction', () => {
		for (const entry of primerManifest) {
			expect(typeof entry.body).toBe('function');
			expect(typeof entry.interaction).toBe('function');
			// The interaction call must return a snippet (function) — not null —
			// because every primer in this slice MUST be interactive.
			const result = entry.interaction();
			expect(result).not.toBeNull();
		}
	});

	it('getPrimer(term) returns the matching entry', () => {
		const e = getPrimer('logits');
		expect(e).not.toBeUndefined();
		expect(e?.term).toBe('logits');
	});

	it('getPrimer(unknown) returns undefined', () => {
		expect(getPrimer('not-a-real-term')).toBeUndefined();
	});
});
