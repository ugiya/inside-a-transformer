<script lang="ts">
	// "Be the Last Receiver" — Hall of Memory immersive RNN-bottleneck game.
	// Orchestrator: holds runtime state and routes between phase screens.
	// Phases: threshold → sinking → simulating → debriefing → exit.
	// PRD #18.
	import Threshold from './Threshold.svelte';
	import SinkTransition from './SinkTransition.svelte';
	import Simulation from './Simulation.svelte';
	import Debrief from './Debrief.svelte';
	import { initWeights } from '$lib/rnn/weights';
	import { generateTransmission, PALETTE, EMBED_DIM } from '$lib/rnn/transmissions';
	import type { Weights } from '$lib/rnn/recurrence';
	import type { Residue } from '$lib/rnn/recurrence';
	import type { AccuracyAtPosition } from '$lib/rnn/recall-test';

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
	let accuracy = $state<readonly AccuracyAtPosition[]>([]);

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

	function onDebriefDone(curve: readonly AccuracyAtPosition[]) {
		accuracy = curve;
		phase = 'exit';
	}

	function replay() {
		// New seed so a replay isn't identical.
		seed = Math.floor(Math.random() * 1e6);
		finalTrajectory = [];
		finalBlooms = [];
		accuracy = [];
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
		<Debrief {words} seed={seed} onComplete={onDebriefDone} />
	{:else if phase === 'exit'}
		<section class="exit-pane" data-test="exit-pane">
			<p class="meta-narration" data-test="meta-narration">
				In the next chamber, the new wireless learns to look back at every
				transmission at will.
			</p>
			<p class="cue">
				A <span class="brass-glow">brass-light path</span> warms the door to
				<a href="#exit-to-attention" class="cue-anchor">Attention Hall</a>.
				Step further into the lab when you are ready.
			</p>
			<div class="exit-actions">
				<button
					type="button"
					class="reset"
					onclick={replay}
					data-test="exit-replay"
				>
					step back onto the glyph (replay)
				</button>
				<a class="advance-link" href="/attention-hall" data-test="exit-advance">
					follow the brass-light → Attention Hall
				</a>
			</div>
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
	.exit-pane {
		max-width: 60ch;
		margin: 0 auto;
		padding: 1.5rem 1.75rem;
		text-align: center;
		border: 1px solid var(--brass);
		background: rgba(13, 21, 24, 0.6);
		animation: rise 700ms ease-out both;
	}
	@keyframes rise {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		.exit-pane { animation: none; }
	}
	.meta-narration {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-style: italic;
		color: var(--ivory);
		line-height: 1.55;
	}
	.cue {
		margin: 0 0 1.5rem;
		color: var(--ivory-muted);
		font-size: 0.95rem;
	}
	.brass-glow {
		color: var(--brass-bright);
		text-shadow: 0 0 8px rgba(176, 137, 64, 0.6);
		font-weight: 500;
	}
	.cue-anchor {
		color: var(--brass-bright);
		font-style: italic;
		text-decoration: underline;
	}
	.exit-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	.advance-link {
		display: inline-flex;
		padding: 0.6rem 1.2rem;
		background: rgba(176, 137, 64, 0.12);
		border: 1px solid var(--brass-bright);
		color: var(--brass-bright);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		font-size: 0.85rem;
		text-decoration: none;
		transition: background 200ms ease;
	}
	.advance-link:hover,
	.advance-link:focus-visible {
		background: rgba(176, 137, 64, 0.25);
		outline: none;
	}
	.advance-link:focus-visible {
		outline: 2px solid var(--brass-bright);
		outline-offset: 3px;
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
