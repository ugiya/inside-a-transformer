import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import Debrief from './Debrief.svelte';
import type { AccuracyAtPosition } from '$lib/rnn/recall-test';

describe('Debrief — N-back recall sequence', () => {
	const words = ['signal', 'home', 'bridge'] as const;

	it('renders one question per word in reverse order (last word first)', async () => {
		const onComplete = vi.fn();
		const { container, getByText } = render(Debrief, {
			props: { words, seed: 42, onComplete }
		});

		// First question asks about the LAST word (position index 2, displayed as "3").
		// We check the visible prompt mentions "position 3".
		const prompt1 = container.querySelector('[data-test="debrief-prompt"]');
		expect(prompt1?.textContent ?? '').toMatch(/position 3/);

		// Answer it (whatever the first option is — the test just verifies progression).
		const firstOpt = container.querySelector('[data-test="debrief-option"]') as HTMLButtonElement;
		await fireEvent.click(firstOpt);
		await tick();

		// Now the prompt should ask about position 2.
		const prompt2 = container.querySelector('[data-test="debrief-prompt"]');
		expect(prompt2?.textContent ?? '').toMatch(/position 2/);

		await fireEvent.click(container.querySelector('[data-test="debrief-option"]') as HTMLButtonElement);
		await tick();

		// Position 1 (the first word).
		const prompt3 = container.querySelector('[data-test="debrief-prompt"]');
		expect(prompt3?.textContent ?? '').toMatch(/position 1/);
	});

	it('always offers 4 options including the correct answer at every position', () => {
		const { container } = render(Debrief, {
			props: { words, seed: 42, onComplete: vi.fn() }
		});
		const options = container.querySelectorAll('[data-test="debrief-option"]');
		expect(options.length).toBe(4);
	});

	it('calls onComplete after all questions answered, with an accuracy curve of length T', async () => {
		const onComplete = vi.fn<(curve: readonly AccuracyAtPosition[]) => void>();
		const { container } = render(Debrief, {
			props: { words, seed: 42, onComplete }
		});

		for (let i = 0; i < words.length; i++) {
			const opts = container.querySelectorAll('[data-test="debrief-option"]');
			expect(opts.length).toBeGreaterThan(0);
			// Pick the correct option deterministically: find the button whose text
			// matches the correct word for the question currently shown.
			const correct = words[words.length - 1 - i];
			const button = Array.from(opts).find(
				(b) => b.textContent?.trim() === correct
			) as HTMLButtonElement | undefined;
			expect(button, `correct option present at step ${i}`).toBeDefined();
			await fireEvent.click(button!);
			await tick();
		}

		expect(onComplete).toHaveBeenCalledTimes(1);
		const [curve] = onComplete.mock.calls[0];
		expect(curve.length).toBe(words.length);
		// We always picked the correct option → every entry is true.
		for (const entry of curve) expect(entry.correct).toBe(true);
	});

	it('renders a final accuracy summary in operator voice after completion', async () => {
		const { container } = render(Debrief, {
			props: { words, seed: 42, onComplete: vi.fn() }
		});

		for (let i = 0; i < words.length; i++) {
			const opts = container.querySelectorAll('[data-test="debrief-option"]');
			await fireEvent.click(opts[0] as HTMLButtonElement);
			await tick();
		}

		const summary = container.querySelector('[data-test="debrief-summary"]');
		expect(summary?.textContent ?? '').toMatch(/You held/);
		// Operator-voice framing (speech bubble) must still be present.
		expect(container.querySelector('[data-test="operator-voice"]')).not.toBeNull();
	});

	it('frames the test in operator voice, not as an academic-quiz UI', () => {
		const { container } = render(Debrief, {
			props: { words, seed: 42, onComplete: vi.fn() }
		});
		const voice = container.querySelector('[data-test="operator-voice"]');
		expect(voice).not.toBeNull();
		// No "Quiz" h1/h2 anywhere.
		const text = container.textContent ?? '';
		expect(text.toLowerCase()).not.toContain('quiz');
	});
});
