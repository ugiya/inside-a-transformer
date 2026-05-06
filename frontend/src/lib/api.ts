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

export type AblateHead = { kind: 'ablate_head'; head: number };
export type ZeroNeuron = { kind: 'zero_neuron'; layer: number; neuron: number };
export type PatchResidual = {
	kind: 'patch_residual';
	position: number;
	source_tokens: number[];
};
export type Intervention = AblateHead | ZeroNeuron | PatchResidual;

export async function probe(
	tokens: number[],
	intervention: Intervention,
	cacheKeys: string[]
): Promise<ForwardResponse> {
	const res = await fetch(`${BASE}/probe`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ tokens, cache_keys: cacheKeys, intervention })
	});
	if (!res.ok) {
		throw new ApiError(`/probe returned ${res.status}`, res.status);
	}
	return (await res.json()) as ForwardResponse;
}
