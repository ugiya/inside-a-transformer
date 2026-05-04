import type { PageLoad } from './$types';

export type EmbeddingSnapshot = {
	step: number;
	label: string;
	points: { i: number; x: number; y: number }[];
};

export const load: PageLoad = async ({ fetch }) => {
	const [preGrok, postGrok] = await Promise.all([
		fetch('/embeddings/step_00000.json').then((r) => r.json() as Promise<EmbeddingSnapshot>),
		fetch('/embeddings/step_40000.json').then((r) => r.json() as Promise<EmbeddingSnapshot>)
	]);
	return { preGrok, postGrok };
};
