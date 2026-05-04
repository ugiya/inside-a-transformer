import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import EmbeddingGarden from './+page.svelte';
import { load, CHECKPOINT_STEPS } from './+page';
import type { EmbeddingSnapshot } from './+page';
import { garden } from '$lib/garden.svelte';

function snap(step: number): EmbeddingSnapshot {
	return {
		step,
		label: `step ${step}`,
		points: Array.from({ length: 113 }, (_, i) => ({ i, x: i * 0.01, y: -i * 0.01 }))
	};
}

function makeFetch(): typeof fetch {
	const fn = vi.fn(async (url: string) => {
		const m = url.match(/step_(\d+)\.json/);
		if (!m) throw new Error(`unexpected url ${url}`);
		const step = parseInt(m[1], 10);
		return new Response(JSON.stringify(snap(step)), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}) as unknown as typeof fetch;
	return fn;
}

describe('embedding-garden +page.ts load()', () => {
	it('returns a snapshots map keyed by every step in CHECKPOINT_STEPS', async () => {
		const fakeFetch = makeFetch();
		const { snapshots } = await (load as unknown as (e: { fetch: typeof fetch }) => Promise<{
			snapshots: Record<number, EmbeddingSnapshot>;
		}>)({ fetch: fakeFetch });

		expect(Object.keys(snapshots).map(Number).sort((a, b) => a - b)).toEqual(
			[...CHECKPOINT_STEPS].sort((a, b) => a - b)
		);
		for (const step of CHECKPOINT_STEPS) {
			expect(snapshots[step].step).toBe(step);
			expect(snapshots[step].points).toHaveLength(113);
		}
	});

	it('fetches all snapshot files in parallel (one fetch per step)', async () => {
		const fakeFetch = makeFetch();
		await (load as unknown as (e: { fetch: typeof fetch }) => Promise<unknown>)({
			fetch: fakeFetch
		});
		expect((fakeFetch as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(
			CHECKPOINT_STEPS.length
		);
	});
});

describe('embedding-garden page — 6-step compare panel', () => {
	beforeEach(() => {
		// Open the compare panel so the toggle is visible.
		garden.setView('compare');
		garden.setCheckpoint(0);
	});

	it('renders one button per step in CHECKPOINT_STEPS', () => {
		const snapshots = Object.fromEntries(CHECKPOINT_STEPS.map((s) => [s, snap(s)]));
		const { container } = render(EmbeddingGarden, { props: { data: { snapshots } } });

		const toggle = container.querySelector('.checkpoint-toggle');
		expect(toggle).not.toBeNull();
		const buttons = toggle!.querySelectorAll('button');
		expect(buttons).toHaveLength(CHECKPOINT_STEPS.length);

		const labels = Array.from(buttons).map((b) => b.textContent?.trim());
		for (const step of CHECKPOINT_STEPS) {
			expect(labels.some((l) => l && l.includes(String(step)))).toBe(true);
		}
	});
});
