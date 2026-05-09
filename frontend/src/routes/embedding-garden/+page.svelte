<script lang="ts">
	import { P } from '$lib/style';
	import { garden, CHECKPOINT_STEPS } from '$lib/garden.svelte';
	import type { EmbeddingSnapshot } from './+page';

	let { data } = $props<{ data: { snapshots: Record<number, EmbeddingSnapshot> } }>();
	let hovered = $state<number | null>(null);

	const RING_R = 220;
	const VESSEL_R = 9;
	const CENTER = 280;
	const SVG_SIZE = 560;

	const ringPositions = Array.from({ length: P }, (_, i) => {
		const theta = (2 * Math.PI * i) / P - Math.PI / 2;
		return { cx: CENTER + RING_R * Math.cos(theta), cy: CENTER + RING_R * Math.sin(theta) };
	});
	const indices = Array.from({ length: P }, (_, i) => i);

	const compareData = $derived(data.snapshots[garden.checkpoint]);

	function rescale(points: EmbeddingSnapshot['points'], size: number, padding: number) {
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		for (const p of points) {
			if (p.x < minX) minX = p.x;
			if (p.x > maxX) maxX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.y > maxY) maxY = p.y;
		}
		const dx = maxX - minX || 1;
		const dy = maxY - minY || 1;
		const inner = size - 2 * padding;
		return points.map((p) => ({
			i: p.i,
			cx: padding + ((p.x - minX) / dx) * inner,
			cy: padding + ((p.y - minY) / dy) * inner
		}));
	}

	const compareScaled = $derived(rescale(compareData.points, SVG_SIZE, 30));
</script>

<main>
	<header>
		<a class="back" href="/">← rooms</a>
		<h1>🌱 Embedding Garden</h1>
		<p class="prose">
			Tokens become vectors. The ring holds 113 small empty vessels — one for each integer
			0–112 the model will learn to add. Click a vessel to plant the lookup; plant the whole
			ring to see what the model has to start from. Reveal the comparison panel to glimpse
			where these vectors will live before and after grokking.
		</p>
	</header>

	<section class="explainer" data-test="garden-explainer">
		<h2>What is this room teaching?</h2>
		<p>
			This is the <strong>first thing a transformer does</strong> with any input: turn a
			discrete <em>token</em> (here, an integer like <code>7</code>) into a
			<em>vector</em> (a list of 128 numbers). That conversion is called an
			<strong>embedding lookup</strong>. The whole "garden" metaphor is:
			each integer 0–112 needs a "vessel" (a row in a table) where its 128-number vector
			lives. <em>"Plant a lookup"</em> = give that integer its vector. Click a vessel, plant
			it, that integer now has an embedding.
		</p>

		<h3>Why a <em>ring</em>?</h3>
		<p>
			Two reasons, both load-bearing:
		</p>
		<ol>
			<li>
				<strong>The task lives on a ring.</strong> This whole lab teaches one task:
				<code>(a + b) mod 113</code> — modular addition. Modular arithmetic is
				<em>cyclic</em>: <code>112 + 1 = 0</code> (it wraps around, like a clock).
				So the integers <code>0–112</code> aren't a line — they live on a circle.
				Drawing them as 113 vessels in a ring makes that visible.
			</li>
			<li>
				<strong>The model will rediscover the ring.</strong> When training starts the
				model has no idea its inputs are cyclic. By the end, the embeddings have
				literally arranged themselves in a ring (see the right panel at step 39999).
				The room is asking you to <em>watch the model learn the geometry of the task</em>.
			</li>
		</ol>

		<h3>Why <em>113</em> specifically?</h3>
		<p>
			113 is <strong>prime</strong>. In modular arithmetic, primes give the cleanest
			cycle structure — no smaller sub-cycles to muddle the learning. 113 was the exact
			number used in <em>Nanda et al. (2023)</em>, the paper this lab re-derives. Pick
			any other prime and the geometry would still work; 113 is just the canonical
			choice.
		</p>

		<h3>What does <em>"plant a lookup"</em> mean, mechanically?</h3>
		<p>
			Inside the model there's a giant table called the <strong>embedding matrix</strong>
			— shape <code>114 × 128</code> (113 integers + 1 special <code>=</code> token,
			128 numbers per row). When the model sees the integer <code>7</code>, it does
			one operation: <em>"go to row 7 of this table, return those 128 numbers."</em>
			That's the lookup. Each vessel in the ring stands for one row of that table.
			Clicking a vessel reveals/instantiates that row.
		</p>

		<h3>What are the <em>steps</em> in the right panel?</h3>
		<p>
			<strong>Training steps.</strong> One step = one round of "look at some training
			data, compute the error, nudge every weight in the model a little bit to reduce
			the error." Nanda's setup runs for <strong>40,000 steps</strong> total. The buttons
			<code>0 / 1000 / 5000 / 10000 / 18000 / 39999</code> are snapshots: where the
			embeddings live at each of those moments, so you can scrub through training
			history.
		</p>

		<h3>What is the connection between <em>The Ring</em> (left) and <em>Where the vectors live</em> (right)?</h3>
		<p>
			They show <strong>the same 113 things</strong>, two different ways:
		</p>
		<ul>
			<li>
				<strong>Left — "structure given by the task":</strong> 113 vessels arranged
				in a ring because <em>that's how integers under mod 113 are organized</em>.
				This view never changes. It's the ground truth.
			</li>
			<li>
				<strong>Right — "structure learned by the model":</strong> the actual 128-D
				embedding vector of each of those 113 integers, projected down to 2D so we
				can see them on screen. This view <em>does</em> change — at step 0 it's a
				random scatter (the model knows nothing yet); by step 39999 the dots have
				arranged themselves in a ring.
			</li>
		</ul>
		<p>
			<strong>The punchline:</strong> the right panel ends up looking like the left
			panel. The model, given only pairs <code>(a, b, a+b mod 113)</code> as training
			data, <em>discovers on its own</em> that 0–112 form a cycle. The ring on the
			right at step 39999 is the model saying "I figured out these inputs are on a
			circle." That's the seed of the entire Fourier story you'll meet in
			🌀 Fourier Wing.
		</p>

		<p class="forward">
			Forward: this room creates the embedding table. Every other room <em>uses</em> it.
			In 👁 Attention Hall, the Q/K/V vectors are computed from these very embeddings;
			in 🔥 MLP Forge, the embedding-derived signals get reshuffled; in 🌀 Fourier Wing,
			you'll see that the ring you watched form here is doing all the math.
		</p>
	</section>

	<section class="lab">
		<div class="panel">
			<div class="panel-head">
				<h2>The Ring</h2>
				<div class="counter">
					<strong>{garden.plantedCount}</strong> / {P} planted
				</div>
			</div>
			<svg viewBox="0 0 {SVG_SIZE} {SVG_SIZE}" class="ring-svg" role="img" aria-label="Ring of 113 embedding vessels">
				<circle cx={CENTER} cy={CENTER} r={RING_R} fill="none" stroke="var(--teal)" stroke-width="1" stroke-dasharray="2 4" />
				<g class="pedestal">
					<circle cx={CENTER} cy={CENTER} r="48" fill="var(--teal-deep)" stroke="var(--brass)" stroke-width="1.5" />
					<text x={CENTER} y={CENTER - 4} text-anchor="middle" class="pedestal-label">embed</text>
					<text x={CENTER} y={CENTER + 14} text-anchor="middle" class="pedestal-count">{garden.plantedCount}/{P}</text>
				</g>
				{#each indices as i (i)}
					{@const pos = ringPositions[i]}
					{@const isPlanted = garden.planted[i]}
					{@const isHovered = hovered === i}
					<g class="vessel" class:planted={isPlanted} class:hovered={isHovered}>
						<circle
							cx={pos.cx}
							cy={pos.cy}
							r={VESSEL_R}
							fill={isPlanted ? 'var(--brass-bright)' : 'none'}
							stroke={isPlanted ? 'var(--brass)' : 'var(--ivory-muted)'}
							stroke-width={isHovered ? 2 : 1}
							onclick={() => garden.toggle(i)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									garden.toggle(i);
								}
							}}
							onmouseenter={() => (hovered = i)}
							onmouseleave={() => (hovered = null)}
							role="button"
							aria-label="Vessel {i}"
							tabindex="0"
						/>
						<text
							x={pos.cx}
							y={pos.cy - VESSEL_R - 4}
							text-anchor="middle"
							class="vessel-label"
							visibility={isHovered ? 'visible' : 'hidden'}
						>
							{i}
						</text>
					</g>
				{/each}
			</svg>
			<div class="controls">
				<button onclick={() => garden.plantAll()}>Plant all</button>
				<button onclick={() => garden.clear()} class="ghost">Clear</button>
				<button
					onclick={() => garden.setView(garden.view === 'ring' ? 'compare' : 'ring')}
					class="brass"
				>
					{garden.view === 'compare' ? 'Hide compare' : 'Compare ↗'}
				</button>
			</div>
		</div>

		{#if garden.view === 'compare'}
			<div class="panel">
				<div class="panel-head">
					<h2>Where the vectors live</h2>
					<div class="checkpoint-toggle">
						{#each CHECKPOINT_STEPS as step (step)}
							<button
								class:active={garden.checkpoint === step}
								onclick={() => garden.setCheckpoint(step)}
								title="checkpoint at training step {step}"
							>
								{step}
							</button>
						{/each}
					</div>
				</div>
				<svg viewBox="0 0 {SVG_SIZE} {SVG_SIZE}" class="compare-svg" role="img" aria-label="2D projection of embeddings">
					<text x="20" y="30" class="compare-label">{compareData.label}</text>
					{#each compareScaled as p (p.i)}
						<circle cx={p.cx} cy={p.cy} r="4" fill="var(--brass-bright)" opacity="0.85" />
					{/each}
				</svg>
				<p class="caption">
					Step 0: random scatter — token IDs are arbitrary. As training progresses the points
					reorganize, and by step 39999 the integers have settled onto a ring — the network
					has learned they form a cycle. <em>This is the Fourier Wing's punchline,
						glimpsed early.</em>
				</p>
			</div>
		{/if}
	</section>
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}
	.back {
		color: var(--brass-bright);
		text-decoration: none;
		font-size: 0.9rem;
	}
	header h1 {
		font-size: 2rem;
		margin: 0.5rem 0 0.5rem;
		color: var(--ivory);
	}
	.prose {
		max-width: 60ch;
		color: var(--ivory-muted);
		line-height: 1.5;
	}
	.explainer {
		max-width: 72ch;
		margin: 1.5rem 0 0;
		padding: 1.25rem 1.5rem;
		border-left: 2px solid var(--brass);
		background: rgba(13, 21, 24, 0.45);
		color: var(--ivory-muted);
		font-size: 0.95rem;
		line-height: 1.6;
	}
	.explainer h2 {
		font-size: 1.05rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
		margin: 0 0 0.75rem;
	}
	.explainer h3 {
		font-size: 1rem;
		font-weight: 500;
		color: var(--ivory);
		margin: 1.25rem 0 0.5rem;
	}
	.explainer p {
		margin: 0 0 0.75rem;
	}
	.explainer p:last-child {
		margin: 0;
	}
	.explainer strong {
		color: var(--ivory);
	}
	.explainer em {
		color: var(--brass-bright);
		font-style: italic;
	}
	.explainer code {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
		font-size: 0.9em;
	}
	.explainer ol,
	.explainer ul {
		margin: 0.25rem 0 0.75rem 1.25rem;
		padding: 0;
	}
	.explainer ol li,
	.explainer ul li {
		margin-bottom: 0.5rem;
	}
	.explainer .forward {
		font-size: 0.88rem;
		color: var(--ivory-muted);
		font-style: italic;
		border-top: 1px dashed var(--teal);
		padding-top: 0.75rem;
		margin-top: 1rem;
	}
	.lab {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		margin-top: 2rem;
	}
	@media (min-width: 1100px) {
		.lab {
			grid-template-columns: 1fr 1fr;
		}
	}
	.panel {
		border: 1px solid var(--teal);
		background: rgba(13, 21, 24, 0.5);
		padding: 1.5rem;
	}
	.panel-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 1rem;
	}
	.panel h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
	}
	.counter {
		color: var(--ivory-muted);
		font-size: 0.95rem;
	}
	.counter strong {
		color: var(--brass-bright);
		font-size: 1.2rem;
	}
	.ring-svg,
	.compare-svg {
		width: 100%;
		max-width: 560px;
		height: auto;
		display: block;
		margin: 0 auto;
	}
	.vessel circle {
		cursor: pointer;
		transition: stroke-width 120ms ease;
	}
	.vessel circle:focus {
		outline: 2px solid var(--brass-bright);
		outline-offset: 2px;
	}
	.vessel-label {
		fill: var(--brass-bright);
		font-size: 11px;
		font-family: 'SF Mono', Menlo, monospace;
	}
	.pedestal-label {
		fill: var(--ivory-muted);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}
	.pedestal-count {
		fill: var(--brass-bright);
		font-size: 14px;
		font-family: 'SF Mono', Menlo, monospace;
	}
	.compare-label {
		fill: var(--ivory-muted);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.controls {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}
	button {
		font: inherit;
		padding: 0.5rem 1rem;
		background: var(--teal);
		color: var(--ivory);
		border: 1px solid var(--teal);
		cursor: pointer;
		letter-spacing: 0.05em;
		transition: background 200ms ease, border-color 200ms ease;
	}
	button:hover {
		border-color: var(--brass);
	}
	button.ghost {
		background: transparent;
	}
	button.brass {
		background: transparent;
		border-color: var(--brass);
		color: var(--brass-bright);
	}
	button.brass:hover {
		background: rgba(176, 137, 64, 0.12);
	}
	.checkpoint-toggle {
		display: flex;
		gap: 0.25rem;
	}
	.checkpoint-toggle button {
		padding: 0.3rem 0.7rem;
		font-size: 0.85rem;
		opacity: 0.55;
	}
	.checkpoint-toggle button.active {
		opacity: 1;
		border-color: var(--brass);
		color: var(--brass-bright);
	}
	.caption {
		color: var(--ivory-muted);
		font-size: 0.9rem;
		margin: 1rem 0 0;
		line-height: 1.5;
	}
	.caption em {
		color: var(--brass-bright);
		font-style: italic;
	}
</style>
