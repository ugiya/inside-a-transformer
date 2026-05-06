import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Finale from './+page.svelte';

const COEFFS = {
	neurons: Array.from({ length: 8 }, (_, i) => ({
		idx: i,
		coefficients: [
			i === 0 ? 0.9 : 0.1, // k=14: top is idx 0
			i === 1 ? 0.9 : 0.1, // k=35
			i === 2 ? 0.9 : 0.1, // k=41
			i === 3 ? 0.9 : 0.1, // k=42
			i === 4 ? 0.9 : 0.1 // k=52
		]
	}))
};
const data = { coefficients: COEFFS };

describe('Fourier Wing finale', () => {
	it('renders 5 circuit rows over time, one per canonical frequency', async () => {
		vi.useFakeTimers();
		const { container } = render(Finale, { props: { data } });
		await vi.advanceTimersByTimeAsync(800 * 6);
		const rows = container.querySelectorAll('[data-circuit-k]');
		expect(rows.length).toBe(5);
		const ks = Array.from(rows).map((r) => r.getAttribute('data-circuit-k'));
		expect(ks).toEqual(['14', '35', '41', '42', '52']);
		vi.useRealTimers();
	});

	it('each circuit row references the top-1 neuron from the data', async () => {
		vi.useFakeTimers();
		const { container } = render(Finale, { props: { data } });
		await vi.advanceTimersByTimeAsync(800 * 6);

		const k14Row = container.querySelector('[data-circuit-k="14"]');
		const k42Row = container.querySelector('[data-circuit-k="42"]');
		expect(k14Row?.textContent).toContain('n0');
		expect(k42Row?.textContent).toContain('n3');
		vi.useRealTimers();
	});

	it('each circuit row mentions a room-of-origin', async () => {
		vi.useFakeTimers();
		const { container } = render(Finale, { props: { data } });
		await vi.advanceTimersByTimeAsync(800 * 6);
		const all = container.querySelectorAll('[data-circuit-k]');
		const roomNames = ['Embedding Garden', 'Hall of Memory', 'Attention Hall', 'MLP Forge', 'Unembedding Tower'];
		for (const row of all) {
			const text = row.textContent ?? '';
			const matched = roomNames.some((n) => text.includes(n));
			expect(matched).toBe(true);
		}
		vi.useRealTimers();
	});

	it('clicking the verify-k=42 button fires baseline forward + 5 zero_neuron probe calls', async () => {
		vi.useFakeTimers();
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
			const logits = new Array(114).fill(0.1);
			logits[22] = 5.0;
			return Promise.resolve(
				new Response(JSON.stringify({ logits, cached: {} }), { status: 200 })
			);
		});

		const { container } = render(Finale, { props: { data } });
		await vi.advanceTimersByTimeAsync(800 * 6);

		const btn = container.querySelector<HTMLButtonElement>('[data-verify-k42]');
		expect(btn).not.toBeNull();
		btn!.click();
		await vi.advanceTimersByTimeAsync(0);
		// allow microtasks / awaited fetches to settle
		for (let i = 0; i < 30; i++) {
			await vi.advanceTimersByTimeAsync(0);
			await Promise.resolve();
		}

		const calls = fetchSpy.mock.calls.map((c) => String(c[0]));
		const forwardCalls = calls.filter((u) => u.match(/\/forward$/));
		const probeCalls = calls.filter((u) => u.match(/\/probe$/));
		expect(forwardCalls.length).toBeGreaterThanOrEqual(1);
		expect(probeCalls.length).toBe(5);

		vi.useRealTimers();
	});
});
