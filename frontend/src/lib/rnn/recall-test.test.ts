import { describe, it, expect } from 'vitest';
import { generateQuestions, scoreRecall, type Question } from './recall-test';
import { PALETTE } from './transmissions';

describe('recall-test — N-back question generation', () => {
	it('returns exactly one question per word in reverse order (last → first)', () => {
		const words = ['bridge', 'troops', 'mother', 'song', 'dawn'];
		const qs = generateQuestions(words, [], PALETTE, 42);

		expect(qs.length).toBe(words.length);
		// Reverse order: positions go from words.length-1 down to 0.
		for (let i = 0; i < qs.length; i++) {
			expect(qs[i].position).toBe(words.length - 1 - i);
		}
	});

	it('every question has 4 options including the correct word', () => {
		const words = ['bridge', 'troops', 'mother', 'song', 'dawn', 'wait', 'signal'];
		const qs = generateQuestions(words, [], PALETTE, 42);

		for (const q of qs) {
			expect(q.options.length).toBe(4);
			expect(q.options).toContain(q.correct);
		}
	});

	it('all distractors come from the palette (no fabricated tokens)', () => {
		const words = ['bridge', 'mother', 'troops', 'song'];
		const qs = generateQuestions(words, [], PALETTE, 99);
		const palWords = new Set(PALETTE.map((p) => p.word));

		for (const q of qs) {
			for (const o of q.options) {
				expect(palWords.has(o)).toBe(true);
			}
		}
	});

	it('is deterministic for fixed seed', () => {
		const words = ['bridge', 'mother', 'troops', 'song'];
		const a = generateQuestions(words, [], PALETTE, 42);
		const b = generateQuestions(words, [], PALETTE, 42);
		expect(a).toEqual(b);
	});

	it('biases distractors toward the correct word\'s type (≥1 same-type distractor on average)', () => {
		// Soft check: across many runs, same-type distractors should outnumber
		// cross-type ones for any given correct token type.
		const words = Array.from({ length: 30 }, (_, i) =>
			i % 2 === 0 ? 'bridge' : 'mother'
		);
		const qs = generateQuestions(words, [], PALETTE, 7);

		let sameTypeCount = 0;
		let totalDistractors = 0;
		for (const q of qs) {
			const correctTok = PALETTE.find((p) => p.word === q.correct);
			if (!correctTok) continue;
			for (const o of q.options) {
				if (o === q.correct) continue;
				const oTok = PALETTE.find((p) => p.word === o);
				if (!oTok) continue;
				totalDistractors++;
				if (oTok.type === correctTok.type) sameTypeCount++;
			}
		}
		// Expect majority same-type (>50% of distractors).
		expect(sameTypeCount / totalDistractors).toBeGreaterThan(0.5);
	});
});

describe('recall-test — scoring', () => {
	it('scoreRecall computes per-position accuracy', () => {
		const qs: Question[] = [
			{ position: 2, correct: 'mother', options: ['mother', 'bridge', 'song', 'dawn'] },
			{ position: 1, correct: 'troops', options: ['troops', 'wait', 'home', 'song'] },
			{ position: 0, correct: 'bridge', options: ['bridge', 'mother', 'name', 'forgive'] }
		];
		const answers = ['mother', 'wait', 'name']; // 1 correct, 2 wrong
		const scored = scoreRecall(qs, answers);

		expect(scored).toEqual([
			{ position: 2, correct: true },
			{ position: 1, correct: false },
			{ position: 0, correct: false }
		]);
	});

	it('throws if questions and answers length mismatch', () => {
		const qs: Question[] = [
			{ position: 0, correct: 'a', options: ['a', 'b', 'c', 'd'] }
		];
		expect(() => scoreRecall(qs, ['a', 'b'])).toThrow();
	});
});
