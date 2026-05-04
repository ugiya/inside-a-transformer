<script lang="ts">
	// Static prologue scene. No props — pure click-through.
	// A chain of N RNN cells passes a memory packet rightward; opacity decays
	// linearly so the player sees the memory fade as it travels — the bottleneck
	// the Attention Hall is going to dissolve.
	const N_CELLS: number = 6;
	const SVG_W = 720;
	const SVG_H = 220;
	const MARGIN_X = 60;
	const Y_MID = SVG_H / 2;

	const cells = Array.from({ length: N_CELLS }, (_, i) => {
		const denom = Math.max(1, N_CELLS - 1);
		const t = i / denom;
		const cx = MARGIN_X + t * (SVG_W - 2 * MARGIN_X);
		// Linear decay from 0.95 down to 0.15 — matches the test's monotonic-and-faded
		// expectation and reads visually as a packet "blurring" along the chain.
		const opacity = 0.95 - 0.8 * t;
		return { i, cx, opacity };
	});
</script>

<main>
	<header>
		<a class="back" href="/">← rooms</a>
		<h1>🕯 Hall of Memory</h1>
	</header>

	<section class="scene">
		<svg
			class="diorama"
			viewBox="0 0 {SVG_W} {SVG_H}"
			role="img"
			aria-label="A chain of recurrent cells passing a fading memory packet"
		>
			<!-- chain wire -->
			<line
				x1={MARGIN_X}
				y1={Y_MID}
				x2={SVG_W - MARGIN_X}
				y2={Y_MID}
				stroke="var(--teal)"
				stroke-width="1"
				stroke-dasharray="2 4"
			/>

			{#each cells as cell (cell.i)}
				<g data-rnn-cell data-index={cell.i}>
					<!-- the cell body -->
					<rect
						x={cell.cx - 22}
						y={Y_MID - 22}
						width="44"
						height="44"
						rx="4"
						fill="var(--teal-deep)"
						stroke="var(--brass)"
						stroke-width="1.5"
					/>
					<text
						x={cell.cx}
						y={Y_MID + 4}
						text-anchor="middle"
						class="cell-label"
					>
						h{cell.i}
					</text>

					<!-- the memory packet "above" the cell, fading along the chain -->
					<circle
						data-memory-packet
						data-index={cell.i}
						cx={cell.cx}
						cy={Y_MID - 56}
						r={8 + 4 * (1 - cell.opacity)}
						fill="var(--brass-bright)"
						opacity={cell.opacity}
					>
						<animate
							attributeName="cy"
							values="{Y_MID - 60};{Y_MID - 52};{Y_MID - 60}"
							dur="2.4s"
							repeatCount="indefinite"
							begin="{cell.i * 0.15}s"
						/>
					</circle>
				</g>
			{/each}
		</svg>

		<aside class="narrator">
			<p class="line-a">
				This is how machines used to read — one word at a time, squeezing every
				memory of what came before through a single small vessel.
			</p>
			<p class="line-b">
				Look how it fades. By the end of even a short sentence, the earliest
				word is almost gone.
			</p>
			<p class="line-c">
				What if every word could just see every other word — directly?
			</p>
		</aside>
	</section>

	<nav class="advance">
		<a class="door" data-door href="/attention-hall">
			<span class="door-label">enter the Attention Hall</span>
			<span class="door-arrow" aria-hidden="true">→</span>
		</a>
	</nav>
</main>

<style>
	main {
		max-width: 1100px;
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
		margin: 0.5rem 0 1.5rem;
		color: var(--ivory);
	}
	.scene {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		align-items: start;
	}
	@media (min-width: 1100px) {
		.scene {
			grid-template-columns: 1.4fr 1fr;
		}
	}
	.diorama {
		width: 100%;
		height: auto;
		display: block;
		border: 1px solid var(--teal);
		background: rgba(13, 21, 24, 0.5);
	}
	.cell-label {
		fill: var(--ivory-muted);
		font-size: 12px;
		font-family: 'SF Mono', Menlo, monospace;
		letter-spacing: 0.05em;
	}
	.narrator {
		border: 1px solid var(--teal);
		background: rgba(13, 21, 24, 0.5);
		padding: 1.5rem;
		color: var(--ivory-muted);
		line-height: 1.5;
	}
	.narrator p {
		margin: 0 0 1rem;
	}
	.narrator p:last-child {
		margin: 0;
		color: var(--brass-bright);
		font-style: italic;
	}
	.advance {
		display: flex;
		justify-content: flex-end;
		margin-top: 2rem;
	}
	.door {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.9rem 1.4rem;
		border: 1px solid var(--brass);
		background: transparent;
		color: var(--brass-bright);
		text-decoration: none;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		font-size: 0.9rem;
		transition: background 200ms ease;
	}
	.door:hover {
		background: rgba(176, 137, 64, 0.12);
	}
	.door-arrow {
		font-size: 1.2rem;
	}
</style>
