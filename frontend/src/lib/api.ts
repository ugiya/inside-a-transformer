export type ForwardResponse = {
	logits: number[];
	cached: Record<string, unknown>;
};

export class ApiError extends Error {
	constructor(message: string, public readonly status: number) {
		super(message);
		this.name = 'ApiError';
	}
}

const BASE = '';

export async function forward(
	tokens: number[],
	cacheKeys: string[]
): Promise<ForwardResponse> {
	const res = await fetch(`${BASE}/forward`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ tokens, cache_keys: cacheKeys })
	});
	if (!res.ok) {
		throw new ApiError(`/forward returned ${res.status}`, res.status);
	}
	return (await res.json()) as ForwardResponse;
}
