import type { PageLoad } from './$types';

export type EmbeddingPoint = { i: number; x: number; y: number };
export type EmbeddingSnapshot = {
	step: number;
	label: string;
	points: EmbeddingPoint[];
};

/**
 * The Fourier Wing's re-entry of the Embedding Garden only needs the
 * post-grok PCA snapshot — the discovery challenge ("prove the embeddings
 * live on a circle") fits a unit circle to the final, fully-grokked
 * checkpoint.
 */
const POSTGROK_STEP = 39999 as const;

export const load: PageLoad = async ({ fetch }) => {
	const fname = `step_${String(POSTGROK_STEP).padStart(5, '0')}.json`;
	const r = await fetch(`/embeddings/${fname}`);
	const postgrok = (await r.json()) as EmbeddingSnapshot;
	return { postgrok };
};
