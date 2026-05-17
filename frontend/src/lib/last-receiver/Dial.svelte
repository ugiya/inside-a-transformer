<script lang="ts">
	// One memory-dial — atomic component.
	// `value` ∈ [-1, +1] drives the needle angle (0 = vertical, +1 = clockwise to 3 o'clock,
	// −1 = counter-clockwise to 9 o'clock). `|value|` drives the inner-face luminosity.
	// Optional `glow` overlays a colored bloom (used for memory-residue visualisation).
	interface Props {
		cx: number;
		cy: number;
		radius: number;
		value: number;
		glow?: { hue: number; intensity: number };
	}
	let { cx, cy, radius, value, glow }: Props = $props();

	const clamped = $derived(Math.max(-1, Math.min(1, value)));
	const needleDeg = $derived(clamped * 90);
	const lum = $derived(Math.abs(clamped));

	// Needle endpoint (90° = 3 o'clock direction; we want 0 = vertical-up,
	// so use sin/-cos rather than cos/sin).
	const needleLen = $derived(radius * 0.72);
	const tipX = $derived(cx + needleLen * Math.sin((needleDeg * Math.PI) / 180));
	const tipY = $derived(cy - needleLen * Math.cos((needleDeg * Math.PI) / 180));
</script>

<g data-test="dial" data-value={value}>
	{#if glow}
		<circle
			data-test="residue-bloom"
			data-word-index={glow.hue}
			cx={cx}
			cy={cy}
			r={radius * (1.4 + 0.6 * glow.intensity)}
			fill="hsl({glow.hue} 80% 55% / {0.18 + 0.55 * glow.intensity})"
			class="bloom"
		/>
	{/if}
	<!-- Outer brass rim -->
	<circle cx={cx} cy={cy} r={radius} class="rim" />
	<!-- Inner face — luminosity proportional to |value| -->
	<circle
		cx={cx}
		cy={cy}
		r={radius * 0.82}
		class="face"
		opacity={0.35 + 0.6 * lum}
	/>
	<!-- Needle -->
	<line x1={cx} y1={cy} x2={tipX} y2={tipY} class="needle" />
	<!-- Pivot dot -->
	<circle cx={cx} cy={cy} r={Math.max(1.2, radius * 0.14)} class="pivot" />
</g>

<style>
	.rim {
		fill: var(--brass-bright);
		stroke: var(--brass);
		stroke-width: 1.8;
	}
	.face {
		fill: var(--teal-deep);
	}
	.needle {
		stroke: var(--ivory);
		stroke-width: 1.5;
		stroke-linecap: round;
	}
	.pivot {
		fill: var(--ivory);
		stroke: var(--brass-bright);
		stroke-width: 0.5;
	}
	.bloom {
		mix-blend-mode: screen;
		filter: blur(2px);
	}
</style>
