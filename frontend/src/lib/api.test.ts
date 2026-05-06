import { describe, it, expect, vi, beforeEach } from 'vitest';
import { forward, probe, ApiError } from './api';

describe('ApiClient.forward', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('sends a POST request with the typed body to /forward', async () => {
		const mockResponse = { logits: [0.1, 0.9], cached: {} };
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

		const result = await forward([5, 17, 113], ['blocks.0.attn.hook_pattern']);

		expect(fetchSpy).toHaveBeenCalledOnce();
		const [url, init] = fetchSpy.mock.calls[0];
		expect(url).toMatch(/\/forward$/);
		expect(init?.method).toBe('POST');
		expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
		expect(JSON.parse(init?.body as string)).toEqual({
			tokens: [5, 17, 113],
			cache_keys: ['blocks.0.attn.hook_pattern']
		});
		expect(result).toEqual(mockResponse);
	});

	it('throws ApiError when the server returns 5xx', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response('internal server error', { status: 500 })
		);

		await expect(forward([5, 17, 113], [])).rejects.toBeInstanceOf(ApiError);
	});

	it('preserves the HTTP status on the thrown ApiError', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 503 }));

		try {
			await forward([5, 17, 113], []);
			throw new Error('should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(ApiError);
			expect((e as ApiError).status).toBe(503);
		}
	});
});

describe('ApiClient.probe', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('POSTs the AblateHead intervention shape to /probe', async () => {
		const mockResponse = { logits: [0.0, 1.0], cached: { 'blocks.0.attn.hook_pattern': [] } };
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

		const result = await probe(
			[5, 17, 113],
			{ kind: 'ablate_head', head: 0 },
			['blocks.0.attn.hook_pattern']
		);

		expect(fetchSpy).toHaveBeenCalledOnce();
		const [url, init] = fetchSpy.mock.calls[0];
		expect(url).toMatch(/\/probe$/);
		expect(init?.method).toBe('POST');
		expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
		expect(JSON.parse(init?.body as string)).toEqual({
			tokens: [5, 17, 113],
			cache_keys: ['blocks.0.attn.hook_pattern'],
			intervention: { kind: 'ablate_head', head: 0 }
		});
		expect(result).toEqual(mockResponse);
	});

	it('POSTs the ZeroNeuron intervention shape to /probe', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ logits: [], cached: {} }), { status: 200 }));

		await probe(
			[5, 17, 113],
			{ kind: 'zero_neuron', layer: 0, neuron: 42 },
			[]
		);

		const [, init] = fetchSpy.mock.calls[0];
		expect(JSON.parse(init?.body as string)).toEqual({
			tokens: [5, 17, 113],
			cache_keys: [],
			intervention: { kind: 'zero_neuron', layer: 0, neuron: 42 }
		});
	});

	it('POSTs the PatchResidual intervention shape to /probe', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ logits: [], cached: {} }), { status: 200 }));

		await probe(
			[5, 17, 113],
			{ kind: 'patch_residual', position: 1, source_tokens: [9, 9, 113] },
			[]
		);

		const [, init] = fetchSpy.mock.calls[0];
		expect(JSON.parse(init?.body as string)).toEqual({
			tokens: [5, 17, 113],
			cache_keys: [],
			intervention: { kind: 'patch_residual', position: 1, source_tokens: [9, 9, 113] }
		});
	});

	it('throws ApiError when /probe returns non-2xx', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response('bad', { status: 422 })
		);
		await expect(
			probe([5, 17, 113], { kind: 'ablate_head', head: 99 }, [])
		).rejects.toBeInstanceOf(ApiError);
	});
});
