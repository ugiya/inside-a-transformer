import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import FourierEmbeddingGarden from './+page.svelte';
import type { EmbeddingSnapshot } from './+page';
import { primers } from '$lib/primers.svelte';

function makeData(): { postgrok: EmbeddingSnapshot } {
	// Build a circular set of 113 points so the discovery challenge passes.
	const points = Array.from({ length: 113 }, (_, i) => {
		const t = (2 * Math.PI * i) / 113;
		return { i, x: Math.cos(t), y: Math.sin(t) };
	});
	return { postgrok: { step: 39999, label: 'step 39999', points } };
}

function mockFetchOk(): ReturnType<typeof vi.fn> {
	const fn = vi.fn(async (_url: string, init?: RequestInit) => {
		// Return a small residual cache and a 113-logits vector.
		const body = init?.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : {};
		const logits = Array.from({ length: 113 }, (_, i) => (i === 42 ? 5 : 0));
		const resid = [Array.from({ length: 32 }, (_, j) => Math.sin(j * 0.1))];
		return new Response(
			JSON.stringify({
				logits,
				cached: { 'blocks.0.hook_resid_pre': resid },
				echo: body
			}),
			{ status: 200, headers: { 'content-type': 'application/json' } }
		);
	});
	vi.spyOn(globalThis, 'fetch').mockImplementation(fn as unknown as typeof fetch);
	return fn;
}

describe('fourier-wing/embedding-garden +page.svelte', () => {
	beforeEach(() => {
		primers.clearAll();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders the ring SVG, the inspector header, and the ablation/patch controls', () => {
		const { container } = render(FourierEmbeddingGarden, { props: { data: makeData() } });
		expect(container.querySelector('[data-test="fw-ring"]')).not.toBeNull();
		expect(container.querySelector('[data-test="fw-inspector-header"]')).not.toBeNull();
		expect(container.querySelector('[data-test="fw-ablate-btn"]')).not.toBeNull();
		expect(container.querySelector('[data-test="fw-patch-btn"]')).not.toBeNull();
		// 113 vessels rendered.
		expect(container.querySelectorAll('[data-test="fw-vessel"]').length).toBe(113);
	});

	it('renders a Primer panel for "circuit" the first time the page loads', () => {
		const { container } = render(FourierEmbeddingGarden, { props: { data: makeData() } });
		const circuitPrimer = container.querySelector('[data-primer][data-term="circuit"]');
		expect(circuitPrimer).not.toBeNull();
		// Body present (not pre-dismissed)
		const body = circuitPrimer!.querySelector('[data-primer-body]');
		expect(body).not.toBeNull();
		// And the primers for the other new vocabulary terms are mounted too.
		expect(container.querySelector('[data-primer][data-term="ablation"]')).not.toBeNull();
		expect(
			container.querySelector('[data-primer][data-term="activation patching"]')
		).not.toBeNull();
		expect(container.querySelector('[data-primer][data-term="residual stream"]')).not.toBeNull();
	});

	it('clicking a vessel fires a /forward call with [vessel, 0, 113] and the resid_pre cache key', async () => {
		const fetchSpy = mockFetchOk();
		const { container } = render(FourierEmbeddingGarden, { props: { data: makeData() } });
		const vessel = container.querySelector('[data-test="fw-vessel"][data-i="42"]') as SVGElement;
		expect(vessel).not.toBeNull();
		await fireEvent.click(vessel);
		await tick();

		expect(fetchSpy).toHaveBeenCalled();
		const [url, init] = fetchSpy.mock.calls[0];
		expect(String(url)).toMatch(/\/forward$/);
		expect(init?.method).toBe('POST');
		expect(JSON.parse(init?.body as string)).toEqual({
			tokens: [42, 0, 113],
			cache_keys: ['blocks.0.hook_resid_pre']
		});
	});

	it('the ablation toggle fires /probe with kind: ablate_head, head: 0', async () => {
		const fetchSpy = mockFetchOk();
		const { container } = render(FourierEmbeddingGarden, { props: { data: makeData() } });
		const btn = container.querySelector('[data-test="fw-ablate-btn"]') as HTMLButtonElement;
		await fireEvent.click(btn);
		await tick();

		expect(fetchSpy).toHaveBeenCalled();
		const probeCall = fetchSpy.mock.calls.find((c) => String(c[0]).match(/\/probe$/));
		expect(probeCall).toBeDefined();
		const [, init] = probeCall!;
		const body = JSON.parse(init?.body as string);
		expect(body.intervention).toEqual({ kind: 'ablate_head', head: 0 });
		expect(body.tokens).toEqual([5, 17, 113]);
		expect(body.cache_keys).toContain('blocks.0.hook_resid_pre');
	});

	it('the patch control fires /probe with kind: patch_residual at position 0', async () => {
		const fetchSpy = mockFetchOk();
		const { container } = render(FourierEmbeddingGarden, { props: { data: makeData() } });
		const btn = container.querySelector('[data-test="fw-patch-btn"]') as HTMLButtonElement;
		await fireEvent.click(btn);
		await tick();
		// Allow the awaited forward + probe pair to resolve fully.
		await new Promise((r) => setTimeout(r, 0));
		await tick();

		const probeCall = fetchSpy.mock.calls.find((c) => String(c[0]).match(/\/probe$/));
		expect(probeCall).toBeDefined();
		const [, init] = probeCall!;
		const body = JSON.parse(init?.body as string);
		expect(body.intervention.kind).toBe('patch_residual');
		expect(body.intervention.position).toBe(0);
		expect(Array.isArray(body.intervention.source_tokens)).toBe(true);
		expect(body.intervention.source_tokens.length).toBe(3);
	});

	it('the discovery-circle check passes when points lie on a unit circle', async () => {
		const { container } = render(FourierEmbeddingGarden, { props: { data: makeData() } });
		const btn = container.querySelector('[data-test="fw-discovery-btn"]') as HTMLButtonElement;
		await fireEvent.click(btn);
		await tick();

		const result = container.querySelector('[data-test="fw-discovery-result"]');
		expect(result).not.toBeNull();
		expect(result!.textContent).toContain('PASS');
		expect(container.querySelector('[data-test="fw-discovery-overlay"]')).not.toBeNull();
	});
});

describe('fourier-wing/embedding-garden +page.ts load()', () => {
	it('fetches step_39999.json and returns it as postgrok', async () => {
		const { load } = await import('./+page');
		const fakeFetch = vi.fn(async (url: string) => {
			expect(url).toMatch(/step_39999\.json$/);
			return new Response(
				JSON.stringify({ step: 39999, label: 'step 39999', points: [] }),
				{ status: 200, headers: { 'content-type': 'application/json' } }
			);
		}) as unknown as typeof fetch;

		const result = await (load as unknown as (e: { fetch: typeof fetch }) => Promise<{
			postgrok: EmbeddingSnapshot;
		}>)({ fetch: fakeFetch });
		expect(result.postgrok.step).toBe(39999);
	});
});
