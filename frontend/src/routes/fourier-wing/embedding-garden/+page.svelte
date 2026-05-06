<script lang="ts">
	import { P } from '$lib/style';
	import { forward, probe, type ForwardResponse } from '$lib/api';
	import Primer from '$lib/Primer.svelte';
	import type { EmbeddingPoint, EmbeddingSnapshot } from './+page';

	let { data } = $props<{ data: { postgrok: EmbeddingSnapshot } }>();

	// --- Ring geometry (kept simple — inline ~30 lines, not a shared component yet) ---
	const RING_R = 200;
	const VESSEL_R = 8;
	const CENTER = 260;
	const SVG_SIZE = 520;

	const ringPositions = Array.from({ length: P }, (_, i) => {
		const theta = (2 * Math.PI * i) / P - Math.PI / 2;
		return { cx: CENTER + RING_R * Math.cos(theta), cy: CENTER + RING_R * Math.sin(theta) };
	});

	// --- Local UI state ---
	let selectedVessel = $state<number | null>(null);
	let inspectorResid = $state<number[] | null>(null);
	let inspectorBusy = $state(false);

	let ablationResid = $state<number[] | null>(null);
	let ablationBusy = $state(false);
	let ablationActive = $state(false);

	let patchSourceToken = $state(7);
	let patchArgmaxBefore = $state<number | null>(null);
	let patchArgmaxAfter = $state<number | null>(null);
	let patchBusy = $state(false);

	let circleResult = $state<null | { passed: boolean; ratio: number; total: number }>(null);

	const cacheKey = 'blocks.0.hook_resid_pre';

	function firstResidVec(resp: ForwardResponse, position = 0): number[] | null {
		const c = resp.cached?.[cacheKey];
		// Server is allowed to return either a [seq][d_model] tensor or a flat list.
		if (Array.isArray(c)) {
			const head = c[0];
			if (Array.isArray(head)) {
				const row = (c as number[][])[position];
				return Array.isArray(row) ? row : null;
			}
			// Flat — assume it's the position-0 row already.
			return c as number[];
		}
		return null;
	}

	function argmax(xs: number[]): number {
		let bi = 0, bv = -Infinity;
		for (let i = 0; i < xs.length; i++) {
			if (xs[i] > bv) {
				bv = xs[i];
				bi = i;
			}
		}
		return bi;
	}

	async function inspectVessel(i: number) {
		selectedVessel = i;
		inspectorBusy = true;
		try {
			const resp = await forward([i, 0, 113], [cacheKey]);
			inspectorResid = firstResidVec(resp, 0);
		} catch {
			inspectorResid = null;
		} finally {
			inspectorBusy = false;
		}
	}

	async function toggleAblation() {
		ablationBusy = true;
		try {
			const resp = await probe(
				[5, 17, 113],
				{ kind: 'ablate_head', head: 0 },
				[cacheKey]
			);
			ablationResid = firstResidVec(resp, 0);
			ablationActive = true;
		} catch {
			ablationResid = null;
		} finally {
			ablationBusy = false;
		}
	}

	async function runPatch() {
		patchBusy = true;
		try {
			const before = await forward([5, 17, 113], []);
			patchArgmaxBefore = argmax(before.logits);
			const after = await probe(
				[5, 17, 113],
				{ kind: 'patch_residual', position: 0, source_tokens: [patchSourceToken, 0, 113] },
				[]
			);
			patchArgmaxAfter = argmax(after.logits);
		} catch {
			patchArgmaxBefore = null;
			patchArgmaxAfter = null;
		} finally {
			patchBusy = false;
		}
	}

	// --- Discovery challenge: fit a unit circle to the post-grok PCA points. ---
	function fitCircle(points: { x: number; y: number }[]): {
		cx: number;
		cy: number;
		r: number;
	} {
		// Centroid + mean-radius — good enough for a discovery overlay.
		let cx = 0, cy = 0;
		for (const p of points) {
			cx += p.x;
			cy += p.y;
		}
		cx /= points.length;
		cy /= points.length;
		let r = 0;
		for (const p of points) {
			r += Math.hypot(p.x - cx, p.y - cy);
		}
		r /= points.length;
		return { cx, cy, r };
	}

	function checkOnCircle(): { passed: boolean; ratio: number; total: number } {
		const { cx, cy, r } = fitCircle(data.postgrok.points);
		const tol = 0.15 * r;
		let ok = 0;
		for (const p of data.postgrok.points) {
			const d = Math.abs(Math.hypot(p.x - cx, p.y - cy) - r);
			if (d <= tol) ok++;
		}
		const total = data.postgrok.points.length;
		const ratio = ok / total;
		return { passed: ratio >= 0.8, ratio, total };
	}

	function runCircleCheck() {
		circleResult = checkOnCircle();
	}

	// Map post-grok points into the ring SVG so the overlay sits on top of the vessels.
	function rescaledPostgrok(): { i: number; cx: number; cy: number }[] {
		const pts: EmbeddingPoint[] = data.postgrok.points;
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		for (const p of pts) {
			if (p.x < minX) minX = p.x;
			if (p.x > maxX) maxX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.y > maxY) maxY = p.y;
		}
		const dx = maxX - minX || 1;
		const dy = maxY - minY || 1;
		const inner = SVG_SIZE - 60;
		return pts.map((p) => ({
			i: p.i,
			cx: 30 + ((p.x - minX) / dx) * inner,
			cy: 30 + ((p.y - minY) / dy) * inner
		}));
	}
	const overlayPoints = $derived(circleResult ? rescaledPostgrok() : []);
	const overlayFit = $derived.by(() => {
		if (!circleResult) return null;
		// Use the rescaled coordinates' centroid + mean radius for the visual overlay.
		const pts = overlayPoints;
		if (pts.length === 0) return null;
		let cx = 0, cy = 0;
		for (const p of pts) {
			cx += p.cx;
			cy += p.cy;
		}
		cx /= pts.length;
		cy /= pts.length;
		let r = 0;
		for (const p of pts) {
			r += Math.hypot(p.cx - cx, p.cy - cy);
		}
		r /= pts.length;
		return { cx, cy, r };
	});
</script>

<main>
	<header>
		<a class="back" href="/">← rooms</a>
		<h1>🌀 Fourier Wing — Embedding Garden, revisited</h1>
		<p class="prose">
			You've been here before. Then you were planting vessels. Now you have hooks, ablations,
			and patches — the tools of a mechinterp investigator. The same 113-vessel ring; new ways
			to ask it questions.
		</p>
	</header>

	<section class="primers">
		<Primer term="circuit" />
		<Primer term="ablation" />
		<Primer term="activation patching" />
		<Primer term="residual stream" />
	</section>

	<section class="lab">
		<div class="panel">
			<div class="panel-head">
				<h2>The Ring (click a vessel to inspect)</h2>
			</div>
			<svg
				viewBox="0 0 {SVG_SIZE} {SVG_SIZE}"
				class="ring-svg"
				role="img"
				aria-label="Ring of 113 embedding vessels"
				data-test="fw-ring"
			>
				<circle
					cx={CENTER}
					cy={CENTER}
					r={RING_R}
					fill="none"
					stroke="var(--teal)"
					stroke-width="1"
					stroke-dasharray="2 4"
				/>
				{#each ringPositions as pos, i (i)}
					<circle
						class="vessel"
						class:selected={selectedVessel === i}
						cx={pos.cx}
						cy={pos.cy}
						r={VESSEL_R}
						fill={selectedVessel === i ? 'var(--brass-bright)' : 'none'}
						stroke={selectedVessel === i ? 'var(--brass)' : 'var(--ivory-muted)'}
						stroke-width="1"
						onclick={() => inspectVessel(i)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								inspectVessel(i);
							}
						}}
						role="button"
						aria-label="Inspect vessel {i}"
						tabindex="0"
						data-test="fw-vessel"
						data-i={i}
					/>
				{/each}

				{#if circleResult && overlayFit}
					<g class="discovery-overlay" data-test="fw-discovery-overlay">
						<circle
							cx={overlayFit.cx}
							cy={overlayFit.cy}
							r={overlayFit.r}
							fill="none"
							stroke="var(--brass-bright)"
							stroke-width="1.5"
							stroke-dasharray="4 3"
						/>
						{#each overlayPoints as p (p.i)}
							<circle cx={p.cx} cy={p.cy} r="2" fill="var(--brass-bright)" opacity="0.8" />
						{/each}
					</g>
				{/if}
			</svg>
		</div>

		<div class="panel">
			<div class="panel-head">
				<h2 data-test="fw-inspector-header">Cache-hook inspector</h2>
			</div>
			<p class="caption">
				Reads <code>blocks.0.hook_resid_pre</code> at position 0 — the residual stream before any
				layer has touched it.
			</p>
			{#if selectedVessel === null}
				<p class="muted">Click a vessel on the ring to read its embedding.</p>
			{:else if inspectorBusy}
				<p class="muted">Probing vessel {selectedVessel}…</p>
			{:else if inspectorResid}
				<div class="bars" data-test="fw-resid-bars">
					{#each inspectorResid.slice(0, 32) as v, i (i)}
						{@const mag = Math.min(1, Math.abs(v))}
						<div class="bar" style="height: {Math.max(2, mag * 36)}px" title="d{i}: {v.toFixed(3)}"></div>
					{/each}
				</div>
				<p class="caption">First 32 dims of the cached residual at vessel {selectedVessel}.</p>
			{:else}
				<p class="muted">No cached vector returned for that hook.</p>
			{/if}
		</div>

		<div class="panel">
			<div class="panel-head">
				<h2>Ablation toggle</h2>
			</div>
			<p class="caption">
				Zero out attention head 0 — does the cycle survive? Compares the ablated residual against
				the unablated baseline.
			</p>
			<button
				class="brass"
				onclick={toggleAblation}
				disabled={ablationBusy}
				data-test="fw-ablate-btn"
			>
				{ablationBusy
					? 'Probing…'
					: ablationActive
					? 'Re-run: ablate head 0'
					: 'Ablate head 0 — does the cycle survive?'}
			</button>
			{#if ablationResid}
				<div class="bars" data-test="fw-ablation-bars">
					{#each ablationResid.slice(0, 32) as v, i (i)}
						{@const mag = Math.min(1, Math.abs(v))}
						<div class="bar ablated" style="height: {Math.max(2, mag * 36)}px"></div>
					{/each}
				</div>
				<p class="caption">Residual after ablation, position 0, first 32 dims.</p>
			{/if}
		</div>

		<div class="panel">
			<div class="panel-head">
				<h2>Activation patch — position 0</h2>
			</div>
			<p class="caption">
				Patch position 0 of <code>[5, 17, 113]</code> with the residual from token X. Watch the
				output argmax flip.
			</p>
			<div class="patch-controls">
				<label>
					Source token (0–112):
					<input
						type="number"
						min="0"
						max="112"
						bind:value={patchSourceToken}
						data-test="fw-patch-source"
					/>
				</label>
				<button
					class="brass"
					onclick={runPatch}
					disabled={patchBusy}
					data-test="fw-patch-btn"
				>
					{patchBusy ? 'Patching…' : `Patch position 0 with token ${patchSourceToken}`}
				</button>
			</div>
			{#if patchArgmaxBefore !== null && patchArgmaxAfter !== null}
				<p class="argmax" data-test="fw-patch-result">
					argmax: <strong>{patchArgmaxBefore}</strong> →
					<strong class:flipped={patchArgmaxBefore !== patchArgmaxAfter}>
						{patchArgmaxAfter}
					</strong>
					{patchArgmaxBefore === patchArgmaxAfter ? ' (no flip)' : ' (flipped)'}
				</p>
			{/if}
		</div>

		<div class="panel discovery">
			<div class="panel-head">
				<h2>Discovery — do the embeddings live on a circle?</h2>
			</div>
			<p class="caption">
				Overlay the post-grok PCA from <code>step_39999.json</code> with a fitted circle. Pass:
				≥80% of points within ±0.15·r of the circle.
			</p>
			<button
				class="brass"
				onclick={runCircleCheck}
				data-test="fw-discovery-btn"
			>
				Prove the embeddings live on a circle
			</button>
			{#if circleResult}
				<p class="argmax" data-test="fw-discovery-result">
					{Math.round(circleResult.ratio * 100)}% of {circleResult.total} points on the circle —
					<strong class:flipped={circleResult.passed}>
						{circleResult.passed ? 'PASS' : 'FAIL'}
					</strong>
				</p>
			{/if}
		</div>
	</section>
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}
	.back {
		color: var(--brass-bright);
		text-decoration: none;
		font-size: 0.9rem;
	}
	header h1 {
		font-size: 1.8rem;
		margin: 0.5rem 0 0.5rem;
		color: var(--ivory);
	}
	.prose {
		max-width: 60ch;
		color: var(--ivory-muted);
		line-height: 1.5;
	}
	.primers {
		display: grid;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}
	.lab {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}
	@media (min-width: 1100px) {
		.lab {
			grid-template-columns: 1fr 1fr;
		}
		.discovery {
			grid-column: 1 / -1;
		}
	}
	.panel {
		border: 1px solid var(--teal);
		background: rgba(13, 21, 24, 0.5);
		padding: 1.25rem;
	}
	.panel-head h2 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
	}
	.ring-svg {
		width: 100%;
		max-width: 520px;
		height: auto;
		display: block;
		margin: 0 auto;
	}
	.vessel {
		cursor: pointer;
	}
	.caption {
		color: var(--ivory-muted);
		font-size: 0.9rem;
		margin: 0.5rem 0;
		line-height: 1.5;
	}
	.muted {
		color: var(--ivory-muted);
		font-style: italic;
	}
	button {
		font: inherit;
		padding: 0.5rem 1rem;
		background: var(--teal);
		color: var(--ivory);
		border: 1px solid var(--teal);
		cursor: pointer;
		letter-spacing: 0.05em;
	}
	button.brass {
		background: transparent;
		border-color: var(--brass);
		color: var(--brass-bright);
	}
	button.brass:hover {
		background: rgba(176, 137, 64, 0.12);
	}
	button:disabled {
		opacity: 0.5;
		cursor: wait;
	}
	.bars {
		display: flex;
		align-items: flex-end;
		gap: 1px;
		height: 40px;
		margin-top: 0.5rem;
	}
	.bar {
		flex: 1;
		background: var(--brass-bright);
		opacity: 0.85;
	}
	.bar.ablated {
		background: var(--ivory-muted);
	}
	.patch-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
		margin: 0.5rem 0;
	}
	.patch-controls input {
		font: inherit;
		width: 5rem;
		padding: 0.25rem 0.4rem;
		background: var(--teal-deep);
		color: var(--ivory);
		border: 1px solid var(--teal);
	}
	.argmax {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--ivory);
	}
	.argmax strong {
		color: var(--brass-bright);
	}
	.argmax strong.flipped {
		color: #d97a4a;
	}
	code {
		font-family: 'SF Mono', Menlo, monospace;
		color: var(--brass-bright);
	}
</style>
