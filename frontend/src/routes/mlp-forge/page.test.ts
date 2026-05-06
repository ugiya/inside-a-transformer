import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import MlpForge from './+page.svelte';

function mockForwardActivations(d_mlp = 512) {
	const logits = new Array(114).fill(0.1);
	logits[22] = 5.0;
	const post = new Array(3)
		.fill(null)
		.map(() => Array.from({ length: d_mlp }, (_, i) => Math.sin(i * 0.13)));
	return new Response(
		JSON.stringify({ logits, cached: { 'blocks.0.mlp.hook_post': post } }),
		{ status: 200 }
	);
}

function mockProbeAblation(argmax = 50) {
	const logits = new Array(114).fill(0);
	logits[argmax] = 3.0;
	return new Response(JSON.stringify({ logits, cached: {} }), { status: 200 });
}

describe('MLP Forge', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('renders header + back-link + 3 assembly parts', () => {
		const { container } = render(MlpForge);
		expect(container.querySelector('a[href="/"]')).not.toBeNull();
		const parts = container.querySelectorAll('button.part');
		expect(parts.length).toBe(3);
	});

	it('does not fetch activations until all 3 parts are wired', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		render(MlpForge);
		await tick();
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('fetches activations once all 3 parts are wired', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockForwardActivations());
		const { container } = render(MlpForge);
		const parts = container.querySelectorAll<HTMLButtonElement>('button.part');
		for (const p of parts) await fireEvent.click(p);
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		const forwardCalls = fetchSpy.mock.calls.filter((c) => String(c[0]).match(/\/forward$/));
		expect(forwardCalls.length).toBe(1);
	});

	it('shows the activation panel with bars after activations load', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockForwardActivations());
		const { container } = render(MlpForge);
		const parts = container.querySelectorAll<HTMLButtonElement>('button.part');
		for (const p of parts) await fireEvent.click(p);
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		await tick();
		const bars = container.querySelectorAll('[data-bar]');
		expect(bars.length).toBeGreaterThan(0);
		expect(bars.length).toBeLessThanOrEqual(64);
	});

	it('shows a baseline cross-entropy number', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockForwardActivations());
		const { container } = render(MlpForge);
		const parts = container.querySelectorAll<HTMLButtonElement>('button.part');
		for (const p of parts) await fireEvent.click(p);
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		await tick();
		const ce = container.querySelector('[data-baseline-ce]');
		expect(ce).not.toBeNull();
		const val = Number(ce!.textContent);
		expect(Number.isFinite(val)).toBe(true);
	});

	it('clicking a bar fires a debounced /probe POST with ZeroNeuron', async () => {
		vi.useFakeTimers();
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
			if (String(url).match(/\/forward$/)) {
				return Promise.resolve(mockForwardActivations());
			}
			return Promise.resolve(mockProbeAblation(50));
		});
		const { container } = render(MlpForge);
		const parts = container.querySelectorAll<HTMLButtonElement>('button.part');
		for (const p of parts) await fireEvent.click(p);
		// allow forward microtask + load
		await vi.advanceTimersByTimeAsync(0);
		await tick();

		const bar = container.querySelector<HTMLButtonElement>('[data-bar][data-index="3"]');
		expect(bar).not.toBeNull();
		await fireEvent.click(bar!);
		await vi.advanceTimersByTimeAsync(200);

		const probeCalls = fetchSpy.mock.calls.filter((c) => String(c[0]).match(/\/probe$/));
		expect(probeCalls.length).toBe(1);
		const body = JSON.parse((probeCalls[0][1] as RequestInit).body as string);
		expect(body.intervention.kind).toBe('zero_neuron');
		expect(body.intervention.neuron).toBe(3);
		vi.useRealTimers();
	});
});
