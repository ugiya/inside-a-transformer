import type { PageLoad } from './$types';
import { CHECKPOINT_STEPS } from '$lib/garden.svelte';

export type EmbeddingSnapshot = {
	step: number;
	label: string;
	points: { i: number; x: number; y: number }[];
};

export const load: PageLoad = async ({ fetch }) => {
	const snapshotsList = await Promise.all(
		CHECKPOINT_STEPS.map(async (step) => {
			const fname = `step_${String(step).padStart(5, '0')}.json`;
			const r = await fetch(`/embeddings/${fname}`);
			const snap = (await r.json()) as EmbeddingSnapshot;
			return [step, snap] as const;
		})
	);
	const snapshots = Object.fromEntries(snapshotsList) as Record<number, EmbeddingSnapshot>;
	return { snapshots };
};
