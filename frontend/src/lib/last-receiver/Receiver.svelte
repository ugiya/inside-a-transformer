<script lang="ts">
	// "The Last Receiver" — clockpunk memory-engine body.
	// Pure-presentational SVG component. Props drive everything.
	//
	// Visual layers (z-bottom to z-top):
	//   1. Dark vignette backdrop
	//   2. Sacred-geometry floor tilework (subtle hex pattern)
	//   3. Stylised vessel/urn silhouette (the "body" the player inhabits)
	//   4. Ornate brass plate on the vessel's chest
	//   5. Ring of N memory-dials on the brass plate
	//   6. Per-dial residue glow blooms (composed via screen-blend)
	//
	// See PRD #18 (https://github.com/ugiya/inside-a-transformer/issues/18) and
	// slice #20 (https://github.com/ugiya/inside-a-transformer/issues/20).
	import Dial from './Dial.svelte';
	import type { ResidueGlow } from './types';

	interface Props {
		N: number;
		h: readonly number[];
		residues?: readonly ResidueGlow[];
	}
	let { N, h, residues = [] }: Props = $props();

	// SVG canvas.
	const VB_W = 800;
	const VB_H = 600;
	const PLATE_CX = 400;
	const PLATE_CY = 280;
	const PLATE_R = 175;

	// Dial-ring geometry — scales with N so dials never overlap.
	const RING_R = 130;
	const dialRadius = $derived(
		Math.max(8, Math.min(28, ((2 * Math.PI * RING_R) / N) * 0.42))
	);

	const dialPositions = $derived(
		Array.from({ length: N }, (_, i) => {
			const theta = (2 * Math.PI * i) / N - Math.PI / 2;
			return {
				cx: PLATE_CX + RING_R * Math.cos(theta),
				cy: PLATE_CY + RING_R * Math.sin(theta),
				value: h[i] ?? 0,
				glow: residues.find((r) => r.wordIndex === i)
			};
		})
	);

	// Hex-tilework parameters for the floor pattern.
	const HEX_R = 22;

	// 12 radial spokes (visual ornament on the brass plate).
	const SPOKES = Array.from({ length: 12 }, (_, i) => i);
</script>

<svg
	data-test="receiver"
	viewBox="0 0 {VB_W} {VB_H}"
	role="img"
	aria-label="Clockpunk memory-engine receiver with {N} memory dials"
	class="receiver"
>
	<defs>
		<!-- Floor tilework: 12-fold sacred-geometry mandala (interlocking
		     circles + radial spokes). Pattern repeats but the unit is wide
		     enough to read as ritual rather than data. -->
		<pattern
			id="floor-mandala"
			width="120"
			height="120"
			patternUnits="userSpaceOnUse"
		>
			<!-- 6 interlocking circles arranged in a hex around a central one -->
			<g stroke="var(--brass)" stroke-width="0.6" fill="none" opacity="0.45">
				<circle cx="60" cy="60" r="22" />
				<circle cx="60" cy="38" r="22" />
				<circle cx="60" cy="82" r="22" />
				<circle cx="79" cy="49" r="22" />
				<circle cx="79" cy="71" r="22" />
				<circle cx="41" cy="49" r="22" />
				<circle cx="41" cy="71" r="22" />
			</g>
			<g stroke="var(--brass-bright)" stroke-width="0.4" opacity="0.35">
				<line x1="60" y1="38" x2="60" y2="82" />
				<line x1="41" y1="49" x2="79" y2="71" />
				<line x1="79" y1="49" x2="41" y2="71" />
			</g>
			<circle cx="60" cy="60" r="2" fill="var(--brass-bright)" opacity="0.7" />
		</pattern>

		<!-- Floor radial fade — the mandala dims toward the canvas edges. -->
		<radialGradient id="floor-fade" cx="50%" cy="100%" r="65%">
			<stop offset="0%" stop-color="rgba(0, 0, 0, 0)" />
			<stop offset="70%" stop-color="rgba(13, 21, 24, 0.4)" />
			<stop offset="100%" stop-color="rgba(13, 21, 24, 1)" />
		</radialGradient>

		<!-- Backdrop vignette. -->
		<radialGradient id="backdrop" cx="50%" cy="35%" r="85%">
			<stop offset="0%" stop-color="rgba(31, 58, 61, 0.65)" />
			<stop offset="100%" stop-color="rgba(13, 21, 24, 1)" />
		</radialGradient>

		<!-- Brass radial gradient for the plate. -->
		<radialGradient id="brassPlate" cx="50%" cy="45%" r="65%">
			<stop offset="0%" stop-color="var(--brass-bright)" stop-opacity="0.98" />
			<stop offset="55%" stop-color="var(--brass)" stop-opacity="0.95" />
			<stop offset="100%" stop-color="rgba(60, 45, 25, 0.95)" />
		</radialGradient>

		<!-- Vessel silhouette gradient — warm brown-brass, ink-wash flavoured. -->
		<linearGradient id="vesselFill" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" stop-color="rgba(140, 105, 60, 0.95)" />
			<stop offset="55%" stop-color="rgba(95, 70, 45, 0.95)" />
			<stop offset="100%" stop-color="rgba(35, 28, 22, 1)" />
		</linearGradient>

		<!-- Stronger ink-wash filter — visibly distorts edges so the silhouette
		     reads as painted, not vector. Two-octave fractal noise with larger
		     displacement for the brushy effect Bret-Victor / 3B1B / Distill all
		     hand-tune toward. -->
		<filter id="inkWash" x="-10%" y="-10%" width="120%" height="120%">
			<feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed="7" result="noise" />
			<feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
		</filter>

		<!-- Lighter ink-wash for the plate (we don't want crazy distortion on
		     the perfectly-circular focal element, just a touch of organicness). -->
		<filter id="plateWash" x="-5%" y="-5%" width="110%" height="110%">
			<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="11" result="n2" />
			<feDisplacementMap in="SourceGraphic" in2="n2" scale="2" />
		</filter>
	</defs>

	<!-- Backdrop -->
	<rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#backdrop)" />

	<!-- Floor tilework — fills the bottom 45% of the canvas. -->
	<g data-test="floor">
		<rect x="0" y={VB_H * 0.55} width={VB_W} height={VB_H * 0.45} fill="url(#floor-mandala)" />
		<!-- Radial fade so the mandala feels like it's underfoot, not wallpaper. -->
		<rect x="0" y={VB_H * 0.55} width={VB_W} height={VB_H * 0.45} fill="url(#floor-fade)" />
		<!-- Vignette to fade the floor at the back of the room. -->
		<rect x="0" y={VB_H * 0.55} width={VB_W} height="80" fill="url(#backdrop)" opacity="0.7" />
	</g>

	<!-- Vessel/urn silhouette — the "body" the player inhabits.
	     Tall amphora shape: foot → bulged base → narrow waist → broad chest
	     (where the plate sits) → narrow shoulder → neck → lip. The plate
	     focal point lives ON the chest at PLATE_CY; the body extends both
	     above and below it so the player reads "I AM this whole vessel"
	     rather than "I AM this disk." -->
	<g data-test="vessel">
		<!-- Cast shadow at the foot. -->
		<ellipse cx={PLATE_CX} cy={VB_H * 0.84} rx="170" ry="16" fill="rgba(0,0,0,0.55)" />
		<!-- Foot pedestal — a stout stone block beneath the urn. -->
		<rect
			x={PLATE_CX - 90}
			y={VB_H * 0.74}
			width="180"
			height="24"
			rx="3"
			fill="rgba(35, 28, 22, 1)"
			stroke="var(--brass)"
			stroke-width="1"
			opacity="0.85"
		/>
		<!-- Vessel body — tall amphora silhouette painted via ink-wash filter. -->
		<path
			d="
				M {PLATE_CX - 90} {VB_H * 0.74}
				C {PLATE_CX - 130} {VB_H * 0.62}, {PLATE_CX - 165} {PLATE_CY + 110}, {PLATE_CX - 175} {PLATE_CY + 30}
				C {PLATE_CX - 185} {PLATE_CY - 50}, {PLATE_CX - 175} {PLATE_CY - 100}, {PLATE_CX - 95} {PLATE_CY - 175}
				C {PLATE_CX - 78} {PLATE_CY - 195}, {PLATE_CX - 60} {PLATE_CY - 215}, {PLATE_CX - 55} {PLATE_CY - 240}
				L {PLATE_CX + 55} {PLATE_CY - 240}
				C {PLATE_CX + 60} {PLATE_CY - 215}, {PLATE_CX + 78} {PLATE_CY - 195}, {PLATE_CX + 95} {PLATE_CY - 175}
				C {PLATE_CX + 175} {PLATE_CY - 100}, {PLATE_CX + 185} {PLATE_CY - 50}, {PLATE_CX + 175} {PLATE_CY + 30}
				C {PLATE_CX + 165} {PLATE_CY + 110}, {PLATE_CX + 130} {VB_H * 0.62}, {PLATE_CX + 90} {VB_H * 0.74}
				Z
			"
			fill="url(#vesselFill)"
			stroke="rgba(180, 140, 75, 0.95)"
			stroke-width="2.2"
			filter="url(#inkWash)"
		/>
		<!-- Lower-bulge highlight — gives the urn 3/4 dimensionality. -->
		<ellipse
			cx={PLATE_CX - 50}
			cy={PLATE_CY + 90}
			rx="55"
			ry="40"
			fill="rgba(150, 110, 60, 0.25)"
			filter="url(#inkWash)"
		/>
		<!-- Neck rim — clockpunk metal band where the urn's lip meets air. -->
		<rect
			x={PLATE_CX - 60}
			y={PLATE_CY - 248}
			width="120"
			height="14"
			rx="2"
			fill="rgba(140, 105, 60, 0.95)"
			stroke="var(--brass)"
			stroke-width="1.4"
		/>
		<!-- Subtle shoulder banding to break up the long curve. -->
		<ellipse
			cx={PLATE_CX}
			cy={PLATE_CY - 175}
			rx="100"
			ry="6"
			fill="rgba(180, 140, 75, 0.6)"
			stroke="var(--brass)"
			stroke-width="0.8"
			opacity="0.85"
		/>
	</g>

	<!-- Brass plate on the vessel's chest — the focal point. -->
	<g data-test="plate">
		<!-- Outer rim of the plate (with light ink-wash for painted feel) -->
		<circle
			cx={PLATE_CX}
			cy={PLATE_CY}
			r={PLATE_R}
			fill="url(#brassPlate)"
			stroke="var(--brass-bright)"
			stroke-width="1.8"
			filter="url(#plateWash)"
		/>
		<!-- 12 rivets at the cardinal/intercardinal points — clockpunk detail -->
		{#each SPOKES as spoke (spoke)}
			{@const sa = (spoke / 12) * 2 * Math.PI}
			<circle
				cx={PLATE_CX + PLATE_R * 0.93 * Math.cos(sa)}
				cy={PLATE_CY + PLATE_R * 0.93 * Math.sin(sa)}
				r="2.5"
				fill="var(--brass-bright)"
				stroke="rgba(60, 45, 25, 0.8)"
				stroke-width="0.6"
			/>
		{/each}
		<!-- Inner concentric etched rings -->
		<circle
			cx={PLATE_CX}
			cy={PLATE_CY}
			r={PLATE_R * 0.85}
			fill="none"
			stroke="var(--brass-bright)"
			stroke-width="0.7"
			opacity="0.7"
		/>
		<circle
			cx={PLATE_CX}
			cy={PLATE_CY}
			r={PLATE_R * 0.78}
			fill="none"
			stroke="var(--brass)"
			stroke-width="0.6"
			stroke-dasharray="2 4"
			opacity="0.55"
		/>
		<!-- Radial etched spokes -->
		{#each SPOKES as spoke (spoke)}
			{@const sa = (spoke / 12) * 2 * Math.PI}
			<line
				x1={PLATE_CX + (PLATE_R * 0.55) * Math.cos(sa)}
				y1={PLATE_CY + (PLATE_R * 0.55) * Math.sin(sa)}
				x2={PLATE_CX + (PLATE_R * 0.78) * Math.cos(sa)}
				y2={PLATE_CY + (PLATE_R * 0.78) * Math.sin(sa)}
				stroke="var(--brass-bright)"
				stroke-width="0.5"
				opacity="0.5"
			/>
		{/each}
		<!-- Inner sanctum — dark core under the dial ring -->
		<circle
			cx={PLATE_CX}
			cy={PLATE_CY}
			r={RING_R - dialRadius * 1.4}
			fill="rgba(13, 21, 24, 0.85)"
			stroke="var(--brass)"
			stroke-width="1"
		/>
		<!-- Central glyph — sacred-geometry six-pointed star inside the inner sanctum.
		     Foreshadows the Fourier Wing's ring of frequencies. -->
		{#each [0, 1, 2, 3, 4, 5] as p (p)}
			{@const a1 = (p / 6) * 2 * Math.PI - Math.PI / 2}
			{@const a2 = ((p + 2) / 6) * 2 * Math.PI - Math.PI / 2}
			{@const r = (RING_R - dialRadius * 1.4) * 0.65}
			<line
				x1={PLATE_CX + r * Math.cos(a1)}
				y1={PLATE_CY + r * Math.sin(a1)}
				x2={PLATE_CX + r * Math.cos(a2)}
				y2={PLATE_CY + r * Math.sin(a2)}
				stroke="var(--brass-bright)"
				stroke-width="0.8"
				opacity="0.55"
			/>
		{/each}
		<!-- Tiny pulsing eye at center -->
		<circle
			cx={PLATE_CX}
			cy={PLATE_CY}
			r="3"
			fill="var(--brass-bright)"
			opacity="0.9"
		/>
	</g>

	<!-- Dial ring -->
	<g data-test="dial-ring">
		{#each dialPositions as p, i (i)}
			<Dial
				cx={p.cx}
				cy={p.cy}
				radius={dialRadius}
				value={p.value}
				glow={p.glow ? { hue: p.glow.hue, intensity: p.glow.intensity } : undefined}
			/>
		{/each}
	</g>
</svg>

<style>
	.receiver {
		display: block;
		width: 100%;
		height: auto;
		max-width: 800px;
		margin: 0 auto;
		background: rgba(13, 21, 24, 0.85);
		border: 1px solid var(--teal);
	}
</style>
