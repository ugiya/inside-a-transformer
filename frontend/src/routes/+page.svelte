<script lang="ts">
	import { gameState } from '$lib/gameState.svelte';

	const rooms = [
		{ slug: 'math-antechamber', title: 'Math Antechamber', glyph: '📐', enabled: true },
		{ slug: 'embedding-garden', title: 'Embedding Garden', glyph: '🌱', enabled: true },
		{ slug: 'hall-of-memory', title: 'Hall of Memory', glyph: '🕯', enabled: true },
		{ slug: 'attention-hall', title: 'Attention Hall', glyph: '👁', enabled: true },
		{ slug: 'mlp-forge', title: 'MLP Forge', glyph: '🔥', enabled: true },
		{ slug: 'unembedding-tower', title: 'Unembedding Tower', glyph: '🗼', enabled: true },
		{ slug: 'grokking-bell', title: 'Grokking Bell', glyph: '🔔', enabled: true },
		{ slug: 'fourier-wing', title: 'Fourier Wing', glyph: '🌀', enabled: true }
	];

	function skipMathAntechamber() {
		gameState.setMathAntechamberSkipped(true);
	}
</script>

<main>
	<header>
		<h1>Transformer Rooms</h1>
		<p class="sub">A point-and-click lab for transformer architecture and mechanistic interpretability.</p>
	</header>

	<section class="north-star" data-test="lab-goal">
		<h2>What is this lab actually for?</h2>
		<p>
			Every room you'll walk through is in service of <strong>one ultimate goal</strong>:
			<em>re-derive Nanda et al. (2023), <a href="https://arxiv.org/abs/2301.05217" target="_blank" rel="noopener">"Progress measures for grokking via mechanistic interpretability."</a></em>
		</p>
		<p>
			Concretely, that means:
		</p>
		<ol>
			<li>
				Train a tiny transformer on one task: <strong>modular addition</strong> —
				<code>(a + b) mod 113</code>. Inputs are integers <code>0–112</code>; output
				is their sum modulo 113. <em>That's the only thing the model ever does.</em>
			</li>
			<li>
				Watch it <strong>"grok"</strong> — i.e. suddenly generalize after a long
				period of seemingly-memorizing the training set.
			</li>
			<li>
				Open the trained model up and discover that its internal computation is
				built out of <strong>sin and cos waves on the unit circle</strong>, at five
				specific frequencies <code>k ∈ {'{'}14, 35, 41, 42, 52{'}'}</code>. The model
				represents each integer <code>n</code> as points on rotating wheels, and
				addition becomes <em>"add the angles"</em>. This is the
				<strong>Fourier circuit</strong> reveal in 🌀 Fourier Wing.
			</li>
		</ol>
		<p>
			Every room teaches one part of <em>how a transformer works</em>, and every visual
			motif (rings, wheels, sin/cos waves, angles) you'll meet along the way <strong>is
			retroactively a Fourier circuit</strong>. The lab is one long planted setup for
			the punchline in Room 8.
		</p>
		<p class="sequence">
			<strong>The journey:</strong>
			📐 build the math vocabulary →
			🌱 turn integers into vectors →
			🕯 see how the old way (RNN) loses memory →
			👁 every word looks at every word (attention) →
			🔥 squeeze the signal through a hidden layer (MLP) →
			🗼 turn vectors back into next-word predictions →
			🔔 watch grokking happen →
			🌀 the punchline: it was Fourier all along.
		</p>
	</section>

	<ul class="rooms">
		{#each rooms as r (r.slug)}
			<li class:enabled={r.enabled}>
				{#if r.enabled}
					<a href="/{r.slug}">
						<span class="glyph">{r.glyph}</span>
						<span class="title">{r.title}</span>
						<span class="status">enter</span>
					</a>
					{#if r.slug === 'math-antechamber'}
						<button
							type="button"
							class="skip-link"
							onclick={skipMathAntechamber}
							data-test="lobby-skip-math"
						>skip</button>
					{/if}
				{:else}
					<span class="card disabled">
						<span class="glyph">{r.glyph}</span>
						<span class="title">{r.title}</span>
						<span class="status">locked</span>
					</span>
				{/if}
			</li>
		{/each}
	</ul>
</main>

<style>
	main {
		max-width: 720px;
		margin: 0 auto;
		padding: 4rem 2rem;
	}
	header h1 {
		font-size: 2.4rem;
		margin: 0 0 0.4rem;
		color: var(--brass-bright);
		letter-spacing: 0.02em;
	}
	.sub {
		margin: 0 0 1.5rem;
		color: var(--ivory-muted);
	}
	.north-star {
		margin: 0 0 2.5rem;
		padding: 1.25rem 1.5rem;
		border-left: 2px solid var(--brass);
		background: rgba(13, 21, 24, 0.45);
		color: var(--ivory-muted);
		font-size: 0.95rem;
		line-height: 1.6;
	}
	.north-star h2 {
		font-size: 1.05rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
		margin: 0 0 0.75rem;
	}
	.north-star p {
		margin: 0 0 0.75rem;
	}
	.north-star p:last-child {
		margin: 0;
	}
	.north-star ol {
		margin: 0.25rem 0 0.75rem 1.25rem;
		padding: 0;
	}
	.north-star ol li {
		margin-bottom: 0.5rem;
	}
	.north-star strong {
		color: var(--ivory);
	}
	.north-star em {
		color: var(--brass-bright);
		font-style: italic;
	}
	.north-star code {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
		font-size: 0.9em;
	}
	.north-star a {
		color: var(--brass-bright);
		text-decoration: underline;
	}
	.north-star .sequence {
		font-size: 0.88rem;
		font-style: italic;
		border-top: 1px dashed var(--teal);
		padding-top: 0.75rem;
		margin-top: 0.75rem;
	}
	.rooms {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}
	.rooms a,
	.rooms .card {
		display: grid;
		grid-template-columns: 2.5rem 1fr auto;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border: 1px solid var(--teal);
		background: rgba(31, 58, 61, 0.4);
		color: var(--ivory);
		text-decoration: none;
		transition: background 200ms ease, border-color 200ms ease;
	}
	.rooms a:hover {
		background: rgba(176, 137, 64, 0.12);
		border-color: var(--brass);
	}
	.rooms .disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.glyph {
		font-size: 1.5rem;
	}
	.title {
		font-size: 1.1rem;
	}
	.status {
		font-size: 0.85rem;
		color: var(--brass-bright);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.disabled .status {
		color: var(--ivory-muted);
	}
	.rooms li {
		display: flex;
		align-items: stretch;
		gap: 0.4rem;
	}
	.rooms li > a,
	.rooms li > .card {
		flex: 1;
	}
	.skip-link {
		font: inherit;
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		background: transparent;
		color: var(--ivory-muted);
		border: 1px dashed var(--teal);
		padding: 0 0.9rem;
		cursor: pointer;
	}
	.skip-link:hover {
		color: var(--brass-bright);
		border-color: var(--brass);
	}
</style>
