import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from './+page.svelte';

const D_MODEL = 128;
const D_VOCAB = 114;
const P = 113;
const ANSWER = 22;

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

function fakeUnembedPayload() {
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
		answer: ANSWER,
		tokens: [5, 17, P],
		W_U,
		b_U,
		resid_post_final
	};
}

function makeForwardResponse(argmaxIdx: number, withCache = true) {
	const logits = new Array(D_VOCAB).fill(0.1);
	logits[argmaxIdx] = 5.0;
	const cached: Record<string, unknown> = withCache
		? {
				'blocks.0.attn.hook_pattern': PATTERN,
				'blocks.0.hook_resid_pre': [
					Array.from({ length: D_MODEL }, () => 0.05),
					Array.from({ length: D_MODEL }, () => 0.05),
					Array.from({ length: D_MODEL }, () => 0.05)
				],
				'blocks.0.attn.hook_attn_out': [
					Array.from({ length: D_MODEL }, () => 0.02),
					Array.from({ length: D_MODEL }, () => 0.02),
					Array.from({ length: D_MODEL }, () => 0.02)
				],
				'blocks.0.hook_mlp_out': [
					Array.from({ length: D_MODEL }, () => 0.03),
					Array.from({ length: D_MODEL }, () => 0.03),
					Array.from({ length: D_MODEL }, () => 0.03)
				]
			}
		: {};
	return new Response(JSON.stringify({ logits, cached }), { status: 200 });
}

function installFetchMock(opts: { withUnembed: boolean }) {
	const calls: { url: string; init?: RequestInit }[] = [];
	const spy = vi
		.spyOn(globalThis, 'fetch')
		.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
			const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
			calls.push({ url, init });
			if (url.includes('/weights/unembed.json')) {
				if (!opts.withUnembed) {
					return Promise.resolve(new Response('not found', { status: 404 }));
				}
				return Promise.resolve(
					new Response(JSON.stringify(fakeUnembedPayload()), { status: 200 })
				);
			}
			if (url.match(/\/forward$/)) {
				return Promise.resolve(makeForwardResponse(ANSWER, true));
			}
			if (url.match(/\/probe$/)) {
				return Promise.resolve(makeForwardResponse(7, true));
			}
			return Promise.resolve(new Response('not found', { status: 404 }));
		});
	return { spy, calls };
}

describe('Fourier Wing — Attention Hall', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('renders source/target inputs, position selector, and Run button', () => {
		installFetchMock({ withUnembed: true });
		const { container } = render(Page);
		expect(container.querySelector('a[href="/"]')).not.toBeNull();
		expect(
			container.querySelector<HTMLInputElement>('input[data-source-a]')
		).not.toBeNull();
		expect(
			container.querySelector<HTMLInputElement>('input[data-source-b]')
		).not.toBeNull();
		expect(
			container.querySelector('select[data-position-selector]')
		).not.toBeNull();
		expect(
			container.querySelector<HTMLButtonElement>('button[data-run-patched]')
		).not.toBeNull();
	});

	it('clicking Run fires a /probe call with patch_residual + the chosen position', async () => {
		const { calls } = installFetchMock({ withUnembed: true });
		const { container } = render(Page);
		const a = container.querySelector<HTMLInputElement>('input[data-source-a]')!;
		const b = container.querySelector<HTMLInputElement>('input[data-source-b]')!;
		const pos = container.querySelector<HTMLSelectElement>('select[data-position-selector]')!;
		await fireEvent.input(a, { target: { value: '8' } });
		await fireEvent.input(b, { target: { value: '14' } });
		await fireEvent.change(pos, { target: { value: '1' } });
		const run = container.querySelector<HTMLButtonElement>('button[data-run-patched]')!;
		await fireEvent.click(run);
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		await tick();

		const probeCall = calls.find((c) => c.url.match(/\/probe$/));
		expect(probeCall).toBeTruthy();
		const body = JSON.parse((probeCall!.init as RequestInit).body as string);
		expect(body.tokens).toEqual([5, 17, 113]);
		expect(body.intervention.kind).toBe('patch_residual');
		expect(body.intervention.position).toBe(1);
		expect(body.intervention.source_tokens).toEqual([8, 14, 113]);
		// Must also fetch baseline /forward
		expect(calls.some((c) => c.url.match(/\/forward$/))).toBe(true);
	});

	it('logit-attribution panel renders three numeric values when W_U is present', async () => {
		installFetchMock({ withUnembed: true });
		const { container } = render(Page);
		const run = container.querySelector<HTMLButtonElement>('button[data-run-patched]')!;
		await fireEvent.click(run);
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		await tick();

		const embed = container.querySelector('[data-attrib="embed"]');
		const attn = container.querySelector('[data-attrib="attn"]');
		const mlp = container.querySelector('[data-attrib="mlp"]');
		expect(embed).not.toBeNull();
		expect(attn).not.toBeNull();
		expect(mlp).not.toBeNull();
		const embedText = (embed?.textContent ?? '').trim();
		const attnText = (attn?.textContent ?? '').trim();
		const mlpText = (mlp?.textContent ?? '').trim();
		expect(Number.isFinite(Number(embedText))).toBe(true);
		expect(Number.isFinite(Number(attnText))).toBe(true);
		expect(Number.isFinite(Number(mlpText))).toBe(true);
	});

	it('renders heatmaps for both unpatched and patched attention patterns', async () => {
		installFetchMock({ withUnembed: true });
		const { container } = render(Page);
		const run = container.querySelector<HTMLButtonElement>('button[data-run-patched]')!;
		await fireEvent.click(run);
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		await tick();

		expect(container.querySelector('[data-heatmap="unpatched"]')).not.toBeNull();
		expect(container.querySelector('[data-heatmap="patched"]')).not.toBeNull();
	});
});
