<script lang="ts">
	// "Be the Last Receiver" — Hall of Memory immersive game.
	// Slice #19 tracer-bullet placeholder: imports one symbol from each of the
	// 5 deep RNN modules to prove the foundation integrates at the page level.
	// The full visual game ships in slice #21 (Threshold + Sink + Simulation)
	// and slice #22 (Debrief). See PRD #18.
	import { PALETTE, generateTransmission, EMBED_DIM } from '$lib/rnn/transmissions';
	import { getEmbedding } from '$lib/rnn/embeddings';
	import { initWeights } from '$lib/rnn/weights';
	import { runSequence } from '$lib/rnn/recurrence';
	import { generateQuestions } from '$lib/rnn/recall-test';

	const DEFAULT_N = 12;
	const DEFAULT_T = 7;
	const DEMO_SEED = 42;

	// Prove integration: actually call one function from each module so any
	// type / interface mismatch surfaces at compile or test time.
	const demoTransmissions = generateTransmission(PALETTE, DEFAULT_T, DEMO_SEED);
	const demoEmbed = getEmbedding(demoTransmissions[0]);
	const demoWeights = initWeights(DEFAULT_N, EMBED_DIM, DEMO_SEED);
	const initialH: number[] = new Array<number>(DEFAULT_N).fill(0);
	const xSeq = demoTransmissions.map((w) => Array.from(getEmbedding(w)));
	const demoTrajectory = runSequence(initialH, xSeq, demoWeights);
	const demoQuestions = generateQuestions(
		demoTransmissions,
		[],
		PALETTE,
		DEMO_SEED
	);
</script>

<aside class="last-receiver" data-test="last-receiver">
	<header>
		<h2>The Last Receiver</h2>
		<p class="kicker">An immersive RNN-bottleneck game — V1 in progress.</p>
	</header>

	<div class="copy">
		<p>
			You are about to step into a clockwork memory-engine in a besieged watchtower.
			Survivors will dictate their last words to you, one at a time. After their
			messages have passed, command will radio in to ask what you remembered.
			You will not be allowed to look back at the scroll.
		</p>
		<p class="status">
			<strong>Status:</strong> the simulation pipeline is being built one slice
			at a time (see PRD <a href="https://github.com/uri-gil/transformer-rooms/issues/18" target="_blank" rel="noopener">#18</a>).
			This panel is the <em>foundation tracer bullet</em> — the math is wired,
			the visual game ships in the next slice.
		</p>
	</div>

	<dl class="config">
		<dt>Default capacity (N)</dt><dd>{DEFAULT_N} memory dials</dd>
		<dt>Default dictation (T)</dt><dd>{DEFAULT_T} transmissions</dd>
		<dt>Palette</dt><dd>{PALETTE.length} story words ({EMBED_DIM}-D embeddings)</dd>
		<dt>Demo run (seed {DEMO_SEED})</dt><dd class="demo">{demoTransmissions.join(' · ')}</dd>
		<dt>Trajectory length</dt><dd>{demoTrajectory.length} hidden-state snapshots</dd>
		<dt>Recall questions</dt><dd>{demoQuestions.length} (last word first)</dd>
		<dt>First embedding[0]</dt><dd>{demoEmbed[0].toFixed(3)}</dd>
	</dl>
</aside>

<style>
	.last-receiver {
		max-width: 72ch;
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
	.copy p {
		margin: 0 0 0.75rem;
	}
	.copy strong {
		color: var(--ivory);
	}
	.copy em {
		color: var(--brass-bright);
		font-style: italic;
	}
	.copy a {
		color: var(--brass-bright);
		text-decoration: underline;
	}
	.config {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.4rem 1rem;
		margin: 1rem 0 0;
		padding: 0.85rem 1rem;
		background: rgba(13, 21, 24, 0.55);
		border-top: 1px dashed var(--teal);
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.85rem;
	}
	.config dt {
		color: var(--ivory-muted);
	}
	.config dd {
		margin: 0;
		color: var(--brass-bright);
	}
	.config dd.demo {
		color: var(--ivory);
		font-style: italic;
	}
</style>
