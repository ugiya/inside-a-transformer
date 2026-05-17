<script lang="ts">
	import LastReceiver from '$lib/last-receiver/LastReceiver.svelte';

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

	<LastReceiver />

	<section class="explainer" data-test="rnn-explainer">
		<h2>What's actually in each cell?</h2>
		<p class="lede">
			This room is a <strong>Recurrent Neural Network (RNN)</strong> — the kind of
			model that came <em>before</em> transformers. Each box below labeled
			<code>h₀, h₁, …</code> is a <strong>hidden state</strong> — and a hidden state
			is just a <strong>vector</strong>, the same kind of object you dragged in
			📐 Math Antechamber. Typically <code>32</code> or <code>128</code> numbers.
			Together, those numbers = <em>"what the model remembers after reading word n"</em>.
		</p>

		<h3>How a new cell is computed (the recurrence)</h3>
		<pre class="formula" data-test="rnn-formula"><span>h_t = tanh(  W_x · x_t  +  W_h · h_(t-1)  +  b  )</span>
<span>            ─────────     ────────────     ─</span>
<span>            new word's    last cell's      bias</span>
<span>            contribution  contribution     (constant)</span></pre>

		<h3>Every symbol, decoded</h3>
		<p class="hint">
			Read the formula left-to-right; every symbol below is one piece. Nothing
			assumed.
		</p>
		<ul class="glossary">
			<li>
				<strong><code>t</code></strong> — a <em>step counter</em>. Just an integer.
				<code>t = 0</code> after the first word, <code>t = 1</code> after the second,
				<code>t = 5</code> after the sixth, and so on. The whole point of an RNN is
				that the same machine runs once per step, with <code>t</code> ticking up
				each time.
			</li>
			<li>
				<strong><code>h_t</code></strong> — the <em>hidden state at step t</em>: a
				vector of typically 32 (or 128) numbers. <em>This is what we're computing —
				the output of the formula.</em> Read as "h sub t" or just "h at time t."
				It is the model's running memory after the t-th word.
			</li>
			<li>
				<strong><code>h_(t-1)</code></strong> — the hidden state at step <code>t-1</code>,
				i.e. <em>one step earlier</em>. The "previous memory." If <code>t = 5</code>,
				then <code>h_(t-1)</code> means <code>h_4</code>. <em>This is an input to the
				formula, not an output.</em>
			</li>
			<li>
				<strong><code>x_t</code></strong> — the current word's vector (its embedding,
				straight out of 🌱 Embedding Garden). Also an input. Read as "x sub t" — the
				input <em>at this step</em>.
			</li>
			<li>
				<strong><code>W_x</code></strong> — a matrix of <em>learned weights</em>
				(values that get adjusted during training). Every row of <code>W_x</code> is
				one neuron's "recipe" for reading the new word. If <code>h</code> has 32
				numbers and <code>x_t</code> has 100, then <code>W_x</code> is a 32×100 grid.
			</li>
			<li>
				<strong><code>W_x · x_t</code></strong> — matrix × vector. Each output is one
				dot product: row <code>i</code> of <code>W_x</code> dotted with <code>x_t</code>.
				<em>32 rows → 32 dot products → 32 numbers</em> — exactly the "stack of dot
				products" pattern from Math Antechamber's matrix×vector panel. The result is
				a 32-number vector — the "current word's contribution to memory."
			</li>
			<li>
				<strong><code>W_h</code></strong> — another matrix of learned weights, the
				<em>recurrent</em> weights. This one re-mixes the previous hidden state. If
				<code>h</code> has 32 numbers, <code>W_h</code> is 32×32. Read as "the memory
				stirrer" — its job is to take last step's memory and stir it into a useful
				input for this step.
			</li>
			<li>
				<strong><code>W_h · h_(t-1)</code></strong> — same matrix × vector trick again.
				32 rows of <code>W_h</code>, each dotted with the previous 32-number memory →
				32 numbers. The "previous memory's contribution to the new memory."
			</li>
			<li>
				<strong><code>+ b</code></strong> — a learned <em>bias vector</em> of 32
				numbers. A constant nudge added to each of the 32 outputs. Lets a neuron
				say "even if every input is zero, fire a bit anyway."
			</li>
			<li>
				<strong><code>tanh(…)</code></strong> — the <em>hyperbolic tangent</em>
				function. Takes any real number and squashes it into the range
				<code>[−1, +1]</code>. Why? <em>To keep <code>h</code> from exploding.</em>
				Without <code>tanh</code>, the numbers in <code>h</code> could grow huge over
				many steps and the model would become unstable. With it, every entry of
				<code>h</code> stays bounded between −1 and +1. (Every nonlinearity in any
				neural network — <code>tanh</code>, <code>ReLU</code>, <code>sigmoid</code>,
				<code>GELU</code> — does this same job: keeps numbers in a useful range.
				Different functions, same purpose.)
			</li>
		</ul>

		<h3>Reading the formula as a procedure</h3>
		<p class="hint">
			Step-by-step, what a single RNN cell does when the model sees the
			<code>t</code>-th word:
		</p>
		<ol class="glossary">
			<li>
				Compute <code>W_x · x_t</code> → 32 numbers (this word's reading).
			</li>
			<li>
				Compute <code>W_h · h_(t-1)</code> → 32 numbers (the previous memory's reading).
			</li>
			<li>
				Add those together <em>elementwise</em> → 32 numbers.
			</li>
			<li>
				Add the bias vector <code>b</code> → 32 numbers.
			</li>
			<li>
				Apply <code>tanh</code> to each of the 32 numbers → 32 squashed numbers.
			</li>
			<li>
				That's <code>h_t</code>. Save it. Read the next word. Repeat.
			</li>
		</ol>
		<p class="hint">
			One RNN cell = one execution of those 6 steps. Six steps later, you have
			processed 6 words and produced <code>h_5</code>. The chain in the diagram below
			shows that loop unrolled.
		</p>

		<p class="forward">
			Once you can read <code>W·x + b</code>, you can read 80% of any neural-network
			paper. You'll meet it again as Q/K/V projections in 👁 Attention Hall, as
			feed-forward layers in 🔥 MLP Forge, and as the unembedding in 🗼 Unembedding Tower.
		</p>
	</section>

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
	.explainer {
		max-width: 70ch;
		margin: 0 0 2rem;
		padding: 1.25rem 1.5rem;
		border-left: 2px solid var(--brass);
		background: rgba(13, 21, 24, 0.45);
		color: var(--ivory-muted);
		font-size: 0.95rem;
		line-height: 1.55;
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
		font-size: 0.95rem;
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
	.explainer .formula {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
		background: rgba(13, 21, 24, 0.6);
		padding: 0.85rem 1rem;
		margin: 0 0 0.75rem;
		font-size: 0.86rem;
		line-height: 1.55;
		white-space: pre;
		overflow-x: auto;
	}
	.explainer .formula span {
		display: block;
	}
	.explainer .glossary {
		margin: 0.25rem 0 0.75rem 1.25rem;
		padding: 0;
	}
	.explainer .glossary li {
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
