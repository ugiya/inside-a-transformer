import { describe, it, expect, vi, beforeEach } from 'vitest';
import { forward, ApiError } from './api';

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
