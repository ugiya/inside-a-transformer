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
</style>
