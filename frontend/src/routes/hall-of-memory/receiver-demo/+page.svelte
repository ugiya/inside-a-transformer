<script lang="ts">
	// HITL visual-review surface for the Last Receiver body (slice #20).
	// Renders the Receiver at three N values with sample residue configurations
	// so the reviewer can scrub through visual states quickly.
	//
	// Reachable at /hall-of-memory/receiver-demo (not linked from the lobby).
	// Used by playwright-cli for screenshot capture during the HITL gate.
	import Receiver from '$lib/last-receiver/Receiver.svelte';
	import type { ResidueGlow } from '$lib/last-receiver/types';

	// Sample h values for each N — chosen to cover positive, negative, and
	// near-zero readings so dial needles point in varied directions.
	function sampleH(N: number): number[] {
		return Array.from({ length: N }, (_, i) => {
			const phase = (i / N) * 2 * Math.PI;
			return Math.sin(phase + i * 0.7) * 0.85;
		});
	}

	// Sample residues — distinct hues across the colour wheel + varying intensities.
	function sampleResidues(N: number, count: number): ResidueGlow[] {
		const out: ResidueGlow[] = [];
		const k = Math.min(count, N);
		for (let i = 0; i < k; i++) {
			out.push({
				wordIndex: Math.floor((i / k) * N),
				hue: Math.round((i / k) * 360),
				intensity: 0.35 + (i / k) * 0.55
			});
		}
		return out;
	}

	const cases: Array<{ label: string; N: number; residues: ResidueGlow[] }> = [
		{ label: 'N=4 — sparse, large dials, no residue', N: 4, residues: [] },
		{ label: 'N=4 — early simulation (2 residues)', N: 4, residues: sampleResidues(4, 2) },
		{ label: 'N=12 — default, mid-simulation (5 residues)', N: 12, residues: sampleResidues(12, 5) },
		{ label: 'N=12 — late simulation (T=15 residues, fades likely)', N: 12, residues: sampleResidues(12, 7) },
		{ label: 'N=32 — dense, no residue', N: 32, residues: [] },
		{ label: 'N=32 — late simulation (7 residues)', N: 32, residues: sampleResidues(32, 7) }
	];
</script>

<main>
	<header>
		<a class="back" href="/hall-of-memory">← back to Hall of Memory</a>
		<h1>Receiver — visual review (slice #20)</h1>
		<p class="kicker">
			HITL gate for <a href="https://github.com/uri-gil/transformer-rooms/issues/20" target="_blank" rel="noopener">issue #20</a>.
			Six configurations covering N=4, 12, 32 and varied residue states.
			Reviewer confirms: (a) body reads as "you ARE this thing"; (b) dials at N=32 still individually
			readable; (c) residue glow distinct enough to identify words by hue but not muddy at T=15;
			(d) clockpunk + sacred-geometry + ink-wash aesthetic preserved.
		</p>
	</header>

	{#each cases as c, i (i)}
		<section data-test={`case-${c.N}-${c.residues.length}`}>
			<h2>{c.label}</h2>
			<Receiver N={c.N} h={sampleH(c.N)} residues={c.residues} />
		</section>
	{/each}
</main>

<style>
	main {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}
	.back {
		color: var(--brass-bright);
		text-decoration: none;
		font-size: 0.9rem;
	}
	header h1 {
		font-size: 1.7rem;
		margin: 0.5rem 0 0.5rem;
		color: var(--ivory);
	}
	header .kicker {
		color: var(--ivory-muted);
		max-width: 70ch;
		line-height: 1.55;
	}
	header .kicker a {
		color: var(--brass-bright);
	}
	section {
		margin: 2rem 0 1rem;
	}
	section h2 {
		font-size: 0.9rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brass-bright);
		margin: 0 0 0.5rem;
	}
</style>
