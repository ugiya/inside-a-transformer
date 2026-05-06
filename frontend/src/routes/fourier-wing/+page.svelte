<script lang="ts">
	const scenes = [
		{ slug: 'embedding-garden', title: 'Re-enter Embedding Garden', glyph: '🌱' },
		{ slug: 'attention-hall', title: 'Re-enter Attention Hall', glyph: '👁' },
		{ slug: 'mlp-forge', title: 'Re-enter MLP Forge', glyph: '🔥' }
	];
</script>

<main>
	<a class="back" href="/">← rooms</a>
	<h1>🌀 Fourier Wing</h1>
	<p class="prose">
		This is the second pass. The rooms you built are the same rooms — the model is the same model
		— but you carry new tools now: cache hooks, ablations, activation patches. Walk through each
		scene to investigate what the network has actually learned. When you're ready, the finale
		surfaces the five Fourier circuits the wallpaper has been showing you all along.
	</p>

	<section class="scenes">
		<h2>Investigation rooms</h2>
		<ul>
			{#each scenes as s (s.slug)}
				<li>
					<a href="/fourier-wing/{s.slug}">
						<span class="glyph">{s.glyph}</span>
						<span class="title">{s.title}</span>
						<span class="status">enter</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<section class="finale-card">
		<h2>The finale</h2>
		<a class="finale-link" href="/fourier-wing/finale">
			<span class="glyph">🌀</span>
			<span class="title">The Five Fourier Circuits</span>
			<span class="status">reveal</span>
		</a>
		<p class="hint">Visit the three investigation rooms first — each plants a clue the finale spends.</p>
	</section>
</main>

<style>
	main {
		max-width: 720px;
		margin: 0 auto;
		padding: 4rem 2rem;
	}
	.back {
		color: var(--brass-bright);
		text-decoration: none;
		font-size: 0.9rem;
	}
	h1 {
		font-size: 2.4rem;
		margin: 0.5rem 0;
		color: var(--brass-bright);
		letter-spacing: 0.02em;
	}
	.prose {
		max-width: 60ch;
		color: var(--ivory-muted);
		line-height: 1.5;
	}
	h2 {
		margin: 2rem 0 1rem;
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ivory-muted);
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}
	a {
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
	a:hover {
		background: rgba(176, 137, 64, 0.12);
		border-color: var(--brass);
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
	.finale-card {
		margin-top: 3rem;
	}
	.finale-link {
		border-color: var(--brass);
		background: rgba(176, 137, 64, 0.08);
	}
	.hint {
		color: var(--ivory-muted);
		font-size: 0.85rem;
		font-style: italic;
		margin-top: 0.75rem;
	}
</style>
