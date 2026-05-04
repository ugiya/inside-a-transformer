import { P } from './style';

function makeState() {
	const planted: boolean[] = $state(Array.from({ length: P }, () => false));
	let view: 'ring' | 'compare' = $state('ring');
	let checkpoint: 'pre-grok' | 'post-grok' = $state('pre-grok');

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
			return planted.filter(Boolean).length;
		},
		get view() {
			return view;
		},
		setView(v: 'ring' | 'compare') {
			view = v;
		},
		get checkpoint() {
			return checkpoint;
		},
		setCheckpoint(c: 'pre-grok' | 'post-grok') {
			checkpoint = c;
		}
	};
}

export const garden = makeState();
