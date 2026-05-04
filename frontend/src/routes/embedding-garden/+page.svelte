<script lang="ts">
	import { P } from '$lib/style';
	import { garden } from '$lib/garden.svelte';
	import type { EmbeddingSnapshot } from './+page';

	let { data } = $props<{ data: { preGrok: EmbeddingSnapshot; postGrok: EmbeddingSnapshot } }>();
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

	const compareData = $derived(garden.checkpoint === 'pre-grok' ? data.preGrok : data.postGrok);

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
						<button
							class:active={garden.checkpoint === 'pre-grok'}
							onclick={() => garden.setCheckpoint('pre-grok')}
						>
							pre-grok
						</button>
						<button
							class:active={garden.checkpoint === 'post-grok'}
							onclick={() => garden.setCheckpoint('post-grok')}
						>
							post-grok
						</button>
					</div>
				</div>
				<svg viewBox="0 0 {SVG_SIZE} {SVG_SIZE}" class="compare-svg" role="img" aria-label="2D projection of embeddings">
					<text x="20" y="30" class="compare-label">{compareData.label}</text>
					{#each compareScaled as p (p.i)}
						<circle cx={p.cx} cy={p.cy} r="4" fill="var(--brass-bright)" opacity="0.85" />
					{/each}
				</svg>
				<p class="caption">
					Pre-grok: random scatter — token IDs are arbitrary. Post-grok: the network has
					learned that the integers form a cycle, so they live on a ring. <em>This is the
						Fourier Wing's punchline, glimpsed early.</em>
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
