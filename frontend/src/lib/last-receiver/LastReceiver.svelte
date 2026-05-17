<script lang="ts">
	// "Be the Last Receiver" — Hall of Memory immersive RNN-bottleneck game.
	// Orchestrator: holds runtime state and routes between phase screens.
	// Phases: threshold → sinking → simulating → debriefing → exit.
	// PRD #18.
	import Threshold from './Threshold.svelte';
	import SinkTransition from './SinkTransition.svelte';
	import Simulation from './Simulation.svelte';
	import { initWeights } from '$lib/rnn/weights';
	import { generateTransmission, PALETTE, EMBED_DIM } from '$lib/rnn/transmissions';
	import type { Weights } from '$lib/rnn/recurrence';
	import type { Residue } from '$lib/rnn/recurrence';

	type Phase = 'threshold' | 'sinking' | 'simulating' | 'debriefing' | 'exit';

	interface Props {
		// Optional override for the tick pace of the inner Simulation (ms per
		// transmission). Production uses 2500ms; tests pass a small value.
		tickMs?: number;
		// Optional override for the sink-transition duration (ms).
		sinkMs?: number;
	}
	let { tickMs = 2500, sinkMs = 1100 }: Props = $props();

	let phase = $state<Phase>('threshold');
	let N = $state(12);
	let T = $state(7);
	let seed = $state(Math.floor(Math.random() * 1e6));
	let weights = $state<Weights | null>(null);
	let words = $state<readonly string[]>([]);
	let finalTrajectory = $state<readonly (readonly number[])[]>([]);
	let finalBlooms = $state<readonly Residue[]>([]);

	function begin(newN: number, newT: number) {
		N = newN;
		T = newT;
		weights = initWeights(N, EMBED_DIM, seed);
		words = generateTransmission(PALETTE, T, seed);
		phase = 'sinking';
	}

	function onSinkDone() {
		phase = 'simulating';
	}

	function onSimDone(
		trajectory: number[][],
		blooms: readonly Residue[]
	) {
		finalTrajectory = trajectory;
		finalBlooms = blooms;
		phase = 'debriefing';
	}

	function replay() {
		// New seed so a replay isn't identical.
		seed = Math.floor(Math.random() * 1e6);
		finalTrajectory = [];
		finalBlooms = [];
		phase = 'threshold';
	}
</script>

<aside class="last-receiver" data-test="last-receiver" data-phase={phase}>
	<header>
		<h2>The Last Receiver</h2>
		<p class="kicker">An immersive RNN-bottleneck game.</p>
	</header>

	{#if phase === 'threshold'}
		<Threshold initialN={N} initialT={T} onBegin={begin} />
	{:else if phase === 'sinking'}
		<SinkTransition durationMs={sinkMs} onComplete={onSinkDone} />
	{:else if phase === 'simulating' && weights}
		<Simulation
			{N}
			{words}
			weights={weights}
			{tickMs}
			onComplete={onSimDone}
		/>
	{:else if phase === 'debriefing'}
		<section class="debrief-placeholder" data-test="debrief-placeholder">
			<p class="placeholder-line">Debrief coming soon.</p>
			<p class="placeholder-sub">
				You held the dictation. Command will radio in for recall in the next
				iteration (slice 4). Until then, you can step off the glyph and try a
				new configuration.
			</p>
			<button type="button" class="reset" onclick={replay} data-test="debrief-reset">
				step off the glyph
			</button>
		</section>
	{/if}
</aside>

<style>
	.last-receiver {
		margin: 0 0 2rem;
		padding: 1.25rem 1.5rem;
		border-left: 2px solid var(--brass);
		background: rgba(13, 21, 24, 0.45);
		color: var(--ivory-muted);
		font-size: 0.95rem;
		line-height: 1.55;
	}
	.last-receiver header h2 {
		font-size: 1.1rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
		margin: 0 0 0.25rem;
	}
	.last-receiver .kicker {
		margin: 0 0 1rem;
		font-style: italic;
		color: var(--ivory-muted);
	}
	.debrief-placeholder {
		max-width: 60ch;
		margin: 0 auto;
		padding: 1.25rem 1.5rem;
		text-align: center;
		border: 1px dashed var(--teal);
		background: rgba(13, 21, 24, 0.55);
	}
	.placeholder-line {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
		color: var(--brass-bright);
		letter-spacing: 0.08em;
	}
	.placeholder-sub {
		margin: 0 0 1rem;
		font-style: italic;
	}
	.reset {
		display: inline-flex;
		padding: 0.6rem 1.2rem;
		background: transparent;
		border: 1px solid var(--brass);
		color: var(--brass-bright);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		font-size: 0.85rem;
		cursor: pointer;
		transition: background 200ms ease;
	}
	.reset:hover,
	.reset:focus-visible {
		background: rgba(176, 137, 64, 0.15);
		outline: none;
	}
	.reset:focus-visible {
		outline: 2px solid var(--brass-bright);
		outline-offset: 3px;
	}
</style>
