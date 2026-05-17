<script lang="ts">
	// Orchestrates the dictation: one transmission per tick, paced.
	// Per step: calls recurrence.step under the hood (via pre-computed trajectory)
	// and renders Receiver with current h + residue glows.
	// PRD #18 ISC-11/12/13/14/15/16.
	import Receiver from './Receiver.svelte';
	import Transmission from './Transmission.svelte';
	import MathPanel from './MathPanel.svelte';
	import { untrack } from 'svelte';
	import type { ResidueGlow } from './types';
	import type { Weights } from '$lib/rnn/recurrence';
	import {
		runSequence,
		counterfactualTrace,
		computeResidualBlooms,
		type Residue
	} from '$lib/rnn/recurrence';
	import { getEmbedding } from '$lib/rnn/embeddings';
	import { PALETTE } from '$lib/rnn/transmissions';

	interface Props {
		N: number;
		words: readonly string[];
		weights: Weights;
		onComplete: (trajectory: number[][], blooms: readonly Residue[]) => void;
		tickMs?: number;
	}
	let { N, words, weights, onComplete, tickMs = 2500 }: Props = $props();

	// PRD risk mitigation #4: compute the full trajectory + counterfactuals ONCE
	// at mount, not per frame. Parent is expected NOT to mutate props after
	// simulation starts; untrack signals that intent to the runtime.
	const precomputed = untrack(() => {
		const h0: number[] = new Array<number>(N).fill(0);
		const xSeq: number[][] = words.map((w) => Array.from(getEmbedding(w)));
		const trajectory: number[][] = runSequence(h0, xSeq, weights);
		const counterfactuals: number[][][] = xSeq.map((_, i) =>
			counterfactualTrace(h0, xSeq, weights, i)
		);
		const blooms: Residue[] = computeResidualBlooms(trajectory, counterfactuals);
		const maxMag = Math.max(0.01, ...blooms.flatMap((b) => b.magAtStep));
		return { trajectory, blooms, maxMag };
	});
	const trajectory = precomputed.trajectory;
	const blooms = precomputed.blooms;
	const maxMag = precomputed.maxMag;
	const T = untrack(() => words.length);

	const tokenType = (w: string) =>
		PALETTE.find((p) => p.word === w)?.type;

	// Visual placement of each past word's residue on the dial ring.
	// Spread T words evenly around N dials (collisions are possible at large T
	// vs small N; Receiver renders one glow per dial — the most recent wins).
	function dialForPosition(i: number): number {
		return Math.floor((i * N) / Math.max(1, T)) % N;
	}
	function hueForPosition(i: number): number {
		// Spread T residues evenly around the hue wheel.
		return Math.round((i * 360) / Math.max(1, T)) % 360;
	}

	let step_t = $state(0);
	let done = $state(false);

	const h = $derived<number[]>(
		trajectory[Math.min(step_t + 1, trajectory.length - 1)]
	);
	const hPrev = $derived<number[]>(
		trajectory[Math.min(step_t, trajectory.length - 1)]
	);
	const currentWord = $derived(words[Math.min(step_t, T - 1)]);
	const xCurrent = $derived<number[]>(
		Array.from(getEmbedding(currentWord))
	);

	// Per-step residues: each past word (0..step_t) emits one ResidueGlow.
	// Current step's word is included — it's the brightest.
	const residues = $derived<ResidueGlow[]>(
		Array.from({ length: step_t + 1 }, (_, i) => {
			const mag = blooms[i]?.magAtStep[Math.min(step_t + 1, trajectory.length - 1)] ?? 0;
			return {
				wordIndex: dialForPosition(i),
				hue: hueForPosition(i),
				intensity: Math.min(1, mag / maxMag)
			};
		})
	);

	// 2nd-person caption — terse, 1-2 lines, references felt phenomena.
	const brightestDial = $derived<number>(
		h.reduce(
			(maxIdx, val, idx, arr) =>
				Math.abs(val) > Math.abs(arr[maxIdx]) ? idx : maxIdx,
			0
		)
	);
	const oldestResiduePct = $derived<number | null>(
		residues.length > 1 ? Math.round(residues[0].intensity * 100) : null
	);
	const oldestWord = $derived(words[0]);

	$effect(() => {
		if (done) return;
		const id = setInterval(() => {
			if (step_t < T - 1) {
				step_t += 1;
			} else {
				done = true;
				clearInterval(id);
				onComplete(trajectory.map((row) => row.slice()), blooms);
			}
		}, tickMs);
		return () => clearInterval(id);
	});
</script>

<section class="simulation" data-test="simulation" data-step={step_t}>
	<div class="canvas">
		<Receiver {N} {h} {residues} />
	</div>

	<div class="overlay" aria-live="polite" aria-atomic="true">
		{#key step_t}
			<Transmission
				word={currentWord}
				type={tokenType(currentWord)}
				position={step_t}
				total={T}
			/>
		{/key}
	</div>

	<div class="caption-area" aria-live="polite">
		{#key step_t}
			<p class="caption" data-test="sim-caption">
				{#if step_t === 0}
					You feel the first transmission arrive. Dial
					<strong>{brightestDial + 1}</strong> flares as
					<em>'{currentWord}'</em> sweeps through.
				{:else}
					<em>'{currentWord}'</em> washes through. Dial
					<strong>{brightestDial + 1}</strong> shifts; the trace of
					<em>'{oldestWord}'</em> has dimmed to
					<strong>{oldestResiduePct}%</strong>.
				{/if}
			</p>
		{/key}
	</div>

	<MathPanel
		{weights}
		{xCurrent}
		{hPrev}
		hNew={h}
		word={currentWord}
		step={step_t}
	/>
</section>

<style>
	.simulation {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	.canvas {
		width: 100%;
	}
	.overlay {
		min-height: 5rem;
	}
	.caption-area {
		max-width: 56ch;
		min-height: 3rem;
		text-align: center;
		padding: 0 1rem;
	}
	.caption {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--ivory-muted);
		font-style: italic;
		animation: fadeIn 500ms ease-out both;
	}
	.caption strong {
		color: var(--brass-bright);
		font-style: normal;
	}
	.caption em {
		color: var(--ivory);
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@media (prefers-reduced-motion: reduce) {
		.caption { animation: none; }
	}
</style>
