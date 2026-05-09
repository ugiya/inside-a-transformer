<script lang="ts">
	// P4 — Sin/cos as waves. Single θ slider; cos(θ) and sin(θ) graphs side by
	// side with a vertical marker line at θ. Live numeric readouts.
	const TWO_PI = Math.PI * 2;
	let theta = $state(1.2); // radians

	const W = 280;
	const H = 110;
	const PAD_X = 20;
	const PAD_Y = 12;
	const PLOT_W = W - 2 * PAD_X;
	const PLOT_H = H - 2 * PAD_Y;

	function buildPath(fn: (t: number) => number) {
		const N = 80;
		const pts: string[] = [];
		for (let i = 0; i <= N; i++) {
			const t = (i / N) * TWO_PI;
			const v = fn(t); // -1..1
			const sx = PAD_X + (t / TWO_PI) * PLOT_W;
			const sy = PAD_Y + ((1 - v) / 2) * PLOT_H;
			pts.push(`${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`);
		}
		return pts.join(' ');
	}

	const cosPath = buildPath(Math.cos);
	const sinPath = buildPath(Math.sin);

	const markerX = $derived(PAD_X + (theta / TWO_PI) * PLOT_W);

	const cosVal = $derived(Math.cos(theta));
	const sinVal = $derived(Math.sin(theta));

	function fmt(n: number) {
		return n.toFixed(2);
	}
</script>

<div class="sincos-primitive" data-test="sincos-primitive">
	<div class="graphs">
		<div class="graph-block">
			<div class="caption">cos(θ)</div>
			<svg viewBox="0 0 {W} {H}" class="graph" role="img" aria-label="Cosine graph">
				<!-- baseline -->
				<line
					x1={PAD_X}
					y1={PAD_Y + PLOT_H / 2}
					x2={PAD_X + PLOT_W}
					y2={PAD_Y + PLOT_H / 2}
					stroke="var(--ivory-muted)"
					stroke-width="0.5"
					stroke-dasharray="2 3"
				/>
				<path d={cosPath} fill="none" stroke="var(--brass)" stroke-width="2" data-test="cos-path" />
				<line
					x1={markerX}
					y1={PAD_Y}
					x2={markerX}
					y2={PAD_Y + PLOT_H}
					stroke="var(--brass-bright)"
					stroke-width="1.5"
					data-test="cos-marker"
				/>
			</svg>
		</div>
		<div class="graph-block">
			<div class="caption">sin(θ)</div>
			<svg viewBox="0 0 {W} {H}" class="graph" role="img" aria-label="Sine graph">
				<line
					x1={PAD_X}
					y1={PAD_Y + PLOT_H / 2}
					x2={PAD_X + PLOT_W}
					y2={PAD_Y + PLOT_H / 2}
					stroke="var(--ivory-muted)"
					stroke-width="0.5"
					stroke-dasharray="2 3"
				/>
				<path d={sinPath} fill="none" stroke="var(--brass)" stroke-width="2" data-test="sin-path" />
				<line
					x1={markerX}
					y1={PAD_Y}
					x2={markerX}
					y2={PAD_Y + PLOT_H}
					stroke="var(--brass-bright)"
					stroke-width="1.5"
					data-test="sin-marker"
				/>
			</svg>
		</div>
	</div>

	<div class="slider-row">
		<label>
			<span>θ</span>
			<input
				type="range"
				min="0"
				max={TWO_PI.toFixed(4)}
				step="0.01"
				value={theta}
				oninput={(e) => (theta = Number((e.currentTarget as HTMLInputElement).value))}
				data-test="theta-slider"
			/>
		</label>
		<span class="readout" data-test="theta-readout">θ = {fmt(theta)} rad</span>
	</div>
	<div class="readouts">
		<span data-test="cos-readout">cos(θ) = {fmt(cosVal)}</span>
		<span data-test="sin-readout">sin(θ) = {fmt(sinVal)}</span>
	</div>

	<aside class="explainer" data-test="sincos-explainer">
		<h3>What is this teaching?</h3>
		<p>
			<strong>sin</strong> and <strong>cos</strong> ("sine" and "cosine") are two
			functions. Each one takes an <em>angle</em> and returns a number between
			<code>−1</code> and <code>+1</code>. Drag the <code>θ</code> slider — those two
			waves are the values of <code>sin</code> and <code>cos</code> as the angle
			increases.
		</p>

		<h3>Reading every symbol</h3>
		<ul>
			<li>
				<strong><code>θ</code></strong> (Greek letter "theta") — the
				<em>angle</em>. The slider is just an angle dial.
			</li>
			<li>
				<strong><code>rad</code></strong> — short for "<em>radians</em>", the unit
				we're using for the angle. Radians are an alternative to degrees:
				<code>360°</code> = <code>2π rad</code> ≈ <code>6.28 rad</code>. They're the
				default unit because the math comes out cleaner. Halfway around =
				<code>π rad</code> ≈ <code>3.14</code>.
			</li>
			<li>
				<strong><code>cos(θ)</code></strong> — the
				<em>x-coordinate</em> of a point that's walking around the unit circle. As
				<code>θ</code> grows from 0 to <code>2π</code>, the point goes once around
				the circle, and its x-coordinate traces the cosine wave.
			</li>
			<li>
				<strong><code>sin(θ)</code></strong> — the <em>y-coordinate</em> of the
				same point. Sine is just cosine shifted by a quarter-turn.
			</li>
		</ul>
		<p>
			The room subtitle says <em>"circles, unrolled"</em> — that's literal. Take a
			point spinning around a circle, plot its x-coordinate over time → cosine wave.
			Plot its y-coordinate over time → sine wave. They're the <em>same motion</em>
			seen two ways. (Next primitive shows the circle itself.)
		</p>

		<h3>Why does this lab care about sin and cos?</h3>
		<p>
			<strong>This is the actual math the trained model uses internally.</strong> Not
			a metaphor — literally. The whole punchline of the lab in 🌀 Fourier Wing is:
		</p>
		<ul>
			<li>
				The trained model represents each integer <code>n ∈ {'{'}0, 1, ..., 112{'}'}</code>
				as a vector whose components are <code>cos(2πk·n/113)</code> and
				<code>sin(2πk·n/113)</code> for five specific frequencies
				<code>k ∈ {'{'}14, 35, 41, 42, 52{'}'}</code>.
			</li>
			<li>
				Modular addition <code>(a + b) mod 113</code> is computed by the model as
				<em>"add the angles"</em> using the trigonometric identity
				<code>cos(α+β) = cos α · cos β − sin α · sin β</code>.
			</li>
			<li>
				Every Fourier circuit you'll dissect in Room 8 is a sin/cos wave at one of
				those five frequencies. The waves you're scrubbing right now are <em>the
				exact thing</em> the model converged on.
			</li>
		</ul>
		<p class="forward">
			Forward: this seemingly-cosmetic primitive plants the visual + mathematical
			motif of the entire grokking finale. Every brass wave you'll see in 🌀 Fourier
			Wing is one of these.
		</p>
	</aside>
</div>

<style>
	.sincos-primitive {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.graphs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.caption {
		font-size: 0.75rem;
		color: var(--ivory-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-align: center;
		margin-bottom: 0.2rem;
	}
	.graph {
		width: 100%;
		height: auto;
		background: rgba(13, 21, 24, 0.5);
		border: 1px solid var(--teal);
		display: block;
	}
	.slider-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		justify-content: center;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.9rem;
		color: var(--ivory);
	}
	.slider-row input[type='range'] {
		width: 16rem;
		accent-color: var(--brass-bright);
	}
	.readouts {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.9rem;
		color: var(--brass-bright);
	}
	.explainer {
		max-width: 64ch;
		margin: 0.75rem auto 0;
		padding: 1rem 1.25rem;
		border-left: 2px solid var(--brass);
		background: rgba(13, 21, 24, 0.45);
		color: var(--ivory-muted);
		font-size: 0.9rem;
		line-height: 1.55;
	}
	.explainer h3 {
		font-size: 0.92rem;
		font-weight: 500;
		color: var(--ivory);
		margin: 0.75rem 0 0.4rem;
	}
	.explainer h3:first-child {
		margin-top: 0;
	}
	.explainer p {
		margin: 0 0 0.5rem;
	}
	.explainer ul {
		margin: 0.25rem 0 0.5rem 1.25rem;
		padding: 0;
	}
	.explainer ul li {
		margin-bottom: 0.4rem;
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
	}
	.explainer .forward {
		font-size: 0.85rem;
		font-style: italic;
		border-top: 1px dashed var(--teal);
		padding-top: 0.6rem;
		margin-top: 0.6rem;
	}
</style>
