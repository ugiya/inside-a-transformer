import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import AttentionHall from './+page.svelte';

const PATTERN = [
	[
		[1.0, 0.0, 0.0],
		[0.5, 0.5, 0.0],
		[0.4, 0.3, 0.3]
	],
	[
		[1.0, 0.0, 0.0],
		[0.0, 1.0, 0.0],
		[0.0, 0.0, 1.0]
	],
	[
		[1.0, 0.0, 0.0],
		[0.5, 0.5, 0.0],
		[0.2, 0.4, 0.4]
	],
	[
		[1.0, 0.0, 0.0],
		[0.5, 0.5, 0.0],
		[0.33, 0.33, 0.34]
	]
];

function mockForwardOnce(logitsArgmax: number) {
	const logits = new Array(114).fill(0.1);
	logits[logitsArgmax] = 5.0;
	return new Response(
		JSON.stringify({ logits, cached: { 'blocks.0.attn.hook_pattern': PATTERN } }),
		{ status: 200 }
	);
}

describe('Attention Hall', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('renders header + back-link + the QKV wiring panel on mount', () => {
		const { container } = render(AttentionHall);
		expect(container.querySelector('a[href="/"]')).not.toBeNull();
		const wires = container.querySelectorAll('button.wire');
		expect(wires.length).toBe(3);
		const labels = Array.from(wires).map((b) => b.textContent ?? '');
		expect(labels.some((l) => l.includes('Q'))).toBe(true);
		expect(labels.some((l) => l.includes('K'))).toBe(true);
		expect(labels.some((l) => l.includes('V'))).toBe(true);
	});

	it('does NOT fetch attention pattern until all three wires are connected', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		render(AttentionHall);
		await tick();
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('fires a single /forward call once Q+K+V are all connected', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(mockForwardOnce(22));
		const { container } = render(AttentionHall);
		const wires = container.querySelectorAll<HTMLButtonElement>('button.wire');
		for (const w of wires) await fireEvent.click(w);
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		const forwardCalls = fetchSpy.mock.calls.filter((c) =>
			String(c[0]).match(/\/forward$/)
		);
		expect(forwardCalls.length).toBe(1);
	});

	it('renders 4 heatmaps (one per attention head) once wired and loaded', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockForwardOnce(22));
		const { container } = render(AttentionHall);
		const wires = container.querySelectorAll<HTMLButtonElement>('button.wire');
		for (const w of wires) await fireEvent.click(w);
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		await tick();
		const heads = container.querySelectorAll('.head[data-head]');
		expect(heads.length).toBe(4);
	});

	it('clicking ablate-head fires a /probe POST with the right body', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation((url, init) => {
				if (String(url).match(/\/forward$/)) {
					return Promise.resolve(mockForwardOnce(22));
				}
				return Promise.resolve(
					new Response(JSON.stringify({ logits: new Array(114).fill(0), cached: {} }), {
						status: 200
					})
				);
			});
		const { container } = render(AttentionHall);
		const wires = container.querySelectorAll<HTMLButtonElement>('button.wire');
		for (const w of wires) await fireEvent.click(w);
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		await tick();

		const ablateBtn = container.querySelector<HTMLButtonElement>('button.ablate-btn');
		expect(ablateBtn).not.toBeNull();
		await fireEvent.click(ablateBtn!);
		await tick();
		await new Promise((r) => setTimeout(r, 0));

		const probeCalls = fetchSpy.mock.calls.filter((c) => String(c[0]).match(/\/probe$/));
		expect(probeCalls.length).toBe(1);
		const body = JSON.parse((probeCalls[0][1] as RequestInit).body as string);
		expect(body.intervention.kind).toBe('ablate_head');
		expect(body.intervention.head).toBe(0);
	});
});
