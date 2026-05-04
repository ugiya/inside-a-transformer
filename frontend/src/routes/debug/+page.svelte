<script lang="ts">
	import { forward, ApiError } from '$lib/api';
	import DebugView from '$lib/DebugView.svelte';
	import { page } from '$app/state';

	const P = 113;
	const EQUALS = P;

	let logits = $state<number[] | null>(null);
	let error = $state<string | null>(null);

	const a = $derived(Number(page.url.searchParams.get('a') ?? '5'));
	const b = $derived(Number(page.url.searchParams.get('b') ?? '17'));
	const expected = $derived(((a % P) + (b % P)) % P);

	async function run() {
		error = null;
		logits = null;
		try {
			const res = await forward([a, b, EQUALS], []);
			logits = res.logits.slice(0, P);
		} catch (e) {
			error = e instanceof ApiError ? `${e.message}` : String(e);
		}
	}

	$effect(() => {
		if (Number.isFinite(a) && Number.isFinite(b)) run();
	});

	const argmax = $derived(
		logits ? logits.reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0) : -1
	);
</script>

<main>
	<a class="back" href="/">← rooms</a>
	<h1>/debug — real model logits</h1>

	<form>
		<label>
			a
			<input type="number" min="0" max={P - 1} value={a} name="a" />
		</label>
		<label>
			b
			<input type="number" min="0" max={P - 1} value={b} name="b" />
		</label>
		<button type="submit">Run</button>
	</form>

	<p class="prose">
		Input: <code>({a}, {b}, =)</code>. Expected (modular sum): <code>{expected}</code>.
		{#if logits}
			Argmax: <code class:right={argmax === expected} class:wrong={argmax !== expected}>{argmax}</code>.
		{/if}
	</p>

	{#if error}
		<p class="error">Error: {error}. Is the backend running on :8000?</p>
	{:else if logits}
		<DebugView {logits} label="logits[0..112]" />
	{:else}
		<p class="prose">Loading…</p>
	{/if}
</main>

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem;
	}
	h1 {
		color: var(--ivory);
		font-size: 1.6rem;
	}
	.back {
		color: var(--brass-bright);
		text-decoration: none;
		font-size: 0.9rem;
	}
	form {
		display: flex;
		gap: 1rem;
		align-items: end;
		margin: 1.5rem 0;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		color: var(--ivory-muted);
		font-size: 0.9rem;
	}
	input {
		font: inherit;
		padding: 0.5rem;
		background: var(--teal);
		color: var(--ivory);
		border: 1px solid var(--teal);
	}
	button {
		font: inherit;
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid var(--brass);
		color: var(--brass-bright);
		cursor: pointer;
	}
	.prose {
		color: var(--ivory-muted);
	}
	.right {
		color: var(--brass-bright);
	}
	.wrong {
		color: #d97070;
	}
	.error {
		color: #d97070;
	}
	code {
		font-family: 'SF Mono', Menlo, monospace;
		background: rgba(13, 21, 24, 0.7);
		padding: 0.1em 0.4em;
	}
</style>
