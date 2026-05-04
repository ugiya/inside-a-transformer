<script lang="ts">
	const rooms = [
		{ slug: 'embedding-garden', title: 'Embedding Garden', glyph: '🌱', enabled: true },
		{ slug: 'hall-of-memory', title: 'Hall of Memory', glyph: '🕯', enabled: false },
		{ slug: 'attention-hall', title: 'Attention Hall', glyph: '👁', enabled: false },
		{ slug: 'mlp-forge', title: 'MLP Forge', glyph: '🔥', enabled: false },
		{ slug: 'unembedding-tower', title: 'Unembedding Tower', glyph: '🗼', enabled: false },
		{ slug: 'grokking-bell', title: 'Grokking Bell', glyph: '🔔', enabled: false },
		{ slug: 'fourier-wing', title: 'Fourier Wing', glyph: '🌀', enabled: false }
	];
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
</style>
