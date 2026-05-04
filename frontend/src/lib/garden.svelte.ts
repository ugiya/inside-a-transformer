import { P } from './style';

export type View = 'ring' | 'compare';

/**
 * The six training-step checkpoints for which we ship a real PCA-2D
 * embeddings JSON. These are the only valid values of `garden.checkpoint`.
 *
 * Step 0 is pre-grok (random); 39999 is the final, fully-grokked checkpoint
 * (the post-grok ring). Intermediate steps trace the trajectory.
 */
export const CHECKPOINT_STEPS = [0, 1000, 5000, 10000, 18000, 39999] as const;
export type Checkpoint = (typeof CHECKPOINT_STEPS)[number];

function makeState() {
	const planted: boolean[] = $state(Array.from({ length: P }, () => false));
	const count = $derived(planted.reduce((acc, v) => acc + (v ? 1 : 0), 0));
	let view: View = $state('ring');
	let checkpoint: Checkpoint = $state(0);

	return {
		get planted() {
			return planted;
		},
		toggle(i: number) {
			planted[i] = !planted[i];
		},
		plantAll() {
			for (let i = 0; i < P; i++) planted[i] = true;
		},
		clear() {
			for (let i = 0; i < P; i++) planted[i] = false;
		},
		get plantedCount() {
			return count;
		},
		get view() {
			return view;
		},
		setView(v: View) {
			view = v;
		},
		get checkpoint() {
			return checkpoint;
		},
		setCheckpoint(c: Checkpoint) {
			checkpoint = c;
		}
	};
}

export const garden = makeState();
