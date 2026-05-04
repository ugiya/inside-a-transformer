import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from './+page.svelte';

const D_MODEL = 128;
const D_VOCAB = 114;
const P = 113;

/**
 * A deterministic synthetic unembed payload sized to match the real one.
 * Construction:
 *  - `W_U[k][v] = sin(k*0.13 + v*0.07)` — non-collinear across k so that
 *    perturbing residual dim k by DELTA gives a *different* logit-vector
 *    shape per k (and therefore a different softmax / cross-entropy).
 *  - `b_U[v] = 0` for simplicity.
 *  - `resid_post_final[i] = 0.1` constant.
 *  - `answer` = 22, as in the real export.
 */
function fakePayload() {
	const W_U: number[][] = Array.from({ length: D_MODEL }, (_, k) =>
		Array.from({ length: D_VOCAB }, (_, v) => Math.sin(k * 0.13 + v * 0.07))
	);
	const b_U = Array.from({ length: D_VOCAB }, () => 0);
	const resid_post_final = Array.from({ length: D_MODEL }, () => 0.1);
	return {
		step: 39999,
		P,
		d_model: D_MODEL,
		d_vocab: D_VOCAB,
		answer: 22,
		tokens: [5, 17, P],
		W_U,
		b_U,
		resid_post_final
	};
}

function mockUnembedFetch() {
	vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
		const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
		if (url.includes('/weights/unembed.json')) {
			return new Response(JSON.stringify(fakePayload()), { status: 200 });
		}
		return new Response('not found', { status: 404 });
	});
}

describe('Unembedding Tower page', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		mockUnembedFetch();
	});

	it('renders without crashing on mount', () => {
		const { container } = render(Page);
		expect(container.querySelector('main')).not.toBeNull();
	});

	it('has a back-link to the lobby', () => {
		const { container } = render(Page);
		const back = container.querySelector('a[href="/"]');
		expect(back).not.toBeNull();
	});

	it('renders one slider with range 0..127 (integer)', () => {
		const { container } = render(Page);
		const slider = container.querySelector<HTMLInputElement>(
			'input[type="range"][data-slider="resid-position"]'
		);
		expect(slider).not.toBeNull();
		expect(slider?.min).toBe('0');
		expect(slider?.max).toBe('127');
		expect(slider?.step).toBe('1');
	});

	it('renders three live display areas: logits, softmax, cross-entropy', () => {
		const { container } = render(Page);
		expect(container.querySelector('[data-display="logits"]')).not.toBeNull();
		expect(container.querySelector('[data-display="softmax"]')).not.toBeNull();
		expect(container.querySelector('[data-display="cross-entropy"]')).not.toBeNull();
	});

	it('shows a finite numeric cross-entropy after the weights load', async () => {
		const { container } = render(Page);
		// Allow the mocked fetch and downstream $effect to settle.
		await new Promise((r) => setTimeout(r, 0));
		await tick();

		const ce = container.querySelector('[data-ce]');
		expect(ce).not.toBeNull();
		const text = (ce?.textContent ?? '').trim();
		expect(text).not.toBe('');
		expect(text.toLowerCase()).not.toContain('nan');
		expect(text.toLowerCase()).not.toContain('loading');
		const value = Number(text);
		expect(Number.isFinite(value)).toBe(true);
	});

	it('updates the cross-entropy value when the slider input changes', async () => {
		const { container } = render(Page);
		await new Promise((r) => setTimeout(r, 0));
		await tick();

		const slider = container.querySelector<HTMLInputElement>(
			'input[type="range"][data-slider="resid-position"]'
		);
		const ce = container.querySelector('[data-ce]');
		expect(slider).not.toBeNull();
		expect(ce).not.toBeNull();

		const before = (ce?.textContent ?? '').trim();
		// Move the slider — input event is what Svelte binds to.
		await fireEvent.input(slider!, { target: { value: '64' } });
		await tick();
		const after = (ce?.textContent ?? '').trim();

		expect(after).not.toBe(before);
	});
});
