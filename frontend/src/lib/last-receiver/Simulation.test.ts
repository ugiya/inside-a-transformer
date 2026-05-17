import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import Simulation from './Simulation.svelte';
import { initWeights } from '$lib/rnn/weights';
import { EMBED_DIM } from '$lib/rnn/transmissions';
import type { Residue } from '$lib/rnn/recurrence';

describe('Simulation — the dictation pipeline', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders the first transmission word on mount and advances on each tick', async () => {
		const words = ['signal', 'home', 'bridge'] as const;
		const weights = initWeights(12, EMBED_DIM, 42);
		const onComplete = vi.fn();

		const { container } = render(Simulation, {
			props: {
				N: 12,
				words,
				weights,
				onComplete,
				tickMs: 10
			}
		});

		const findWord = () =>
			container.querySelector('[data-test="transmission-word"]')?.textContent ?? '';
		expect(findWord()).toBe('signal');

		await vi.advanceTimersByTimeAsync(10);
		await tick();
		expect(findWord()).toBe('home');

		await vi.advanceTimersByTimeAsync(10);
		await tick();
		expect(findWord()).toBe('bridge');
	});

	it('calls onComplete after T ticks with a trajectory of length T+1 and T residue blooms', async () => {
		const words = ['signal', 'home', 'bridge'] as const;
		const weights = initWeights(8, EMBED_DIM, 7);
		const onComplete =
			vi.fn<(trajectory: number[][], blooms: readonly Residue[]) => void>();

		render(Simulation, {
			props: {
				N: 8,
				words,
				weights,
				onComplete,
				tickMs: 5
			}
		});

		// One tick per transmission to advance, plus one final tick to fire onComplete.
		await vi.advanceTimersByTimeAsync(5 * (words.length + 1));
		await tick();

		expect(onComplete).toHaveBeenCalledTimes(1);
		const [trajectory, blooms] = onComplete.mock.calls[0];
		expect(trajectory.length).toBe(words.length + 1);
		expect(blooms.length).toBe(words.length);
		for (const h of trajectory) expect(h.length).toBe(8);
		for (const b of blooms) expect(b.magAtStep.length).toBe(words.length + 1);
	});

	it('renders N dials sourced from the current trajectory step', () => {
		const words = ['signal', 'home'] as const;
		const weights = initWeights(6, EMBED_DIM, 99);
		const { container } = render(Simulation, {
			props: {
				N: 6,
				words,
				weights,
				onComplete: vi.fn(),
				tickMs: 10
			}
		});
		expect(container.querySelectorAll('[data-test="dial"]').length).toBe(6);
	});

	it('emits one residue-bloom on mount and grows on each tick', async () => {
		const words = ['signal', 'home', 'bridge'] as const;
		const weights = initWeights(12, EMBED_DIM, 13);
		const { container } = render(Simulation, {
			props: {
				N: 12,
				words,
				weights,
				onComplete: vi.fn(),
				tickMs: 10
			}
		});

		expect(
			container.querySelectorAll('[data-test="residue-bloom"]').length
		).toBe(1);

		await vi.advanceTimersByTimeAsync(10);
		await tick();
		expect(
			container.querySelectorAll('[data-test="residue-bloom"]').length
		).toBe(2);
	});
});
