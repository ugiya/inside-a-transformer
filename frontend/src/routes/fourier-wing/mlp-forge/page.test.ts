import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import FourierWingMlpForge from './+page.svelte';

const FREQUENCIES = [14, 35, 41, 42, 52];

// Real top-5 per frequency at step 39999 (computed by export_neuron_fourier).
const TOP5_K14 = [184, 168, 77, 122, 115];

function makeFourierFixture(d_mlp = 512) {
	// Build deterministic coefficients: neuron n at freq k_i gets value
	// proportional to a hash; we then *override* the top-5 for k=14 to be TOP5_K14
	// so the test asserts hypothesis-button behavior independent of math.
	const neurons = [] as { idx: number; coefficients: number[] }[];
	for (let n = 0; n < d_mlp; n++) {
		const coeffs = FREQUENCIES.map((k) => {
			// generic baseline magnitude
			return 0.1 + ((n * 7 + k * 11) % 53) / 1000;
		});
		neurons.push({ idx: n, coefficients: coeffs });
	}
	// Stamp the k=14 (index 0) channel with strong values for TOP5_K14, descending,
	// so argsort-desc on column 0 yields exactly TOP5_K14 in order.
	const strong = [0.9, 0.85, 0.8, 0.75, 0.7];
	TOP5_K14.forEach((idx, i) => {
		neurons[idx].coefficients[0] = strong[i];
	});
	return { step: 39999, frequencies: FREQUENCIES, neurons };
}

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

function mockFourierCoefficients() {
	return new Response(JSON.stringify(makeFourierFixture()), { status: 200 });
}

function installRouter(fetchSpy: ReturnType<typeof vi.spyOn>) {
	fetchSpy.mockImplementation((url: RequestInfo | URL) => {
		const u = String(url);
		if (u.match(/\/forward$/)) return Promise.resolve(mockForwardActivations());
		if (u.match(/\/probe$/)) return Promise.resolve(mockProbeAblation(50));
		if (u.match(/neuron_coefficients\.json$/))
			return Promise.resolve(mockFourierCoefficients());
		return Promise.resolve(new Response('not found', { status: 404 }));
	});
}

async function settle() {
	await tick();
	await new Promise((r) => setTimeout(r, 0));
	await tick();
}

describe('Fourier Wing — MLP Forge', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('has a back link to the lobby', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		installRouter(fetchSpy);
		const { container } = render(FourierWingMlpForge);
		await settle();
		expect(container.querySelector('a[href="/"]')).not.toBeNull();
	});

	it('renders the activation panel after activations + Fourier data load', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		installRouter(fetchSpy);
		const { container } = render(FourierWingMlpForge);
		await settle();
		await settle();
		const bars = container.querySelectorAll('[data-bar]');
		expect(bars.length).toBeGreaterThan(0);
	});

	it('renders the per-neuron Fourier coefficient view', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		installRouter(fetchSpy);
		const { container } = render(FourierWingMlpForge);
		await settle();
		await settle();
		const view = container.querySelector('[data-fourier-view]');
		expect(view).not.toBeNull();
		// One labeled column per canonical frequency.
		for (const k of FREQUENCIES) {
			const col = container.querySelector(`[data-freq="${k}"]`);
			expect(col, `missing column for k=${k}`).not.toBeNull();
		}
	});

	it('selecting multiple neurons and clicking Ablate triggers multiple /probe calls', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		installRouter(fetchSpy);
		const { container } = render(FourierWingMlpForge);
		await settle();
		await settle();

		// Toggle three neuron checkboxes via the multi-select checkbox UI.
		for (const idx of [3, 7, 11]) {
			const cb = container.querySelector<HTMLInputElement>(
				`input[type=checkbox][data-neuron="${idx}"]`
			);
			expect(cb, `missing checkbox for neuron ${idx}`).not.toBeNull();
			await fireEvent.click(cb!);
		}

		const ablateBtn = container.querySelector<HTMLButtonElement>(
			'button[data-action=ablate-selection]'
		);
		expect(ablateBtn).not.toBeNull();
		await fireEvent.click(ablateBtn!);
		await settle();
		await settle();

		const probeCalls = fetchSpy.mock.calls.filter((c) =>
			String(c[0]).match(/\/probe$/)
		);
		expect(probeCalls.length).toBe(3);
		const neurons = probeCalls
			.map((c) => JSON.parse((c[1] as RequestInit).body as string).intervention.neuron)
			.sort((a, b) => a - b);
		expect(neurons).toEqual([3, 7, 11]);
	});

	it('the k=14 hypothesis button selects exactly the top-5 neurons by k=14 coefficient', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		installRouter(fetchSpy);
		const { container } = render(FourierWingMlpForge);
		await settle();
		await settle();

		const btn = container.querySelector<HTMLButtonElement>(
			'button[data-action=test-k14]'
		);
		expect(btn).not.toBeNull();
		await fireEvent.click(btn!);
		await settle();
		await settle();

		const probeCalls = fetchSpy.mock.calls.filter((c) =>
			String(c[0]).match(/\/probe$/)
		);
		expect(probeCalls.length).toBe(5);
		const neurons = probeCalls
			.map((c) => JSON.parse((c[1] as RequestInit).body as string).intervention.neuron)
			.sort((a, b) => a - b);
		expect(neurons).toEqual([...TOP5_K14].sort((a, b) => a - b));
	});
});
