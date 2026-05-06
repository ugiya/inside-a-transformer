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
		margin: 0 0 3rem;
		color: var(--ivory-muted);
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
