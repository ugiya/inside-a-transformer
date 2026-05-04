import { P } from './style';

export type View = 'ring' | 'compare';
export type Checkpoint = 'pre-grok' | 'post-grok';

function makeState() {
	const planted: boolean[] = $state(Array.from({ length: P }, () => false));
	const count = $derived(planted.reduce((acc, v) => acc + (v ? 1 : 0), 0));
	let view: View = $state('ring');
	let checkpoint: Checkpoint = $state('pre-grok');

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
