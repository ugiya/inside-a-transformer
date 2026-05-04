<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Transformer Rooms</title>
</svelte:head>

{@render children()}

<style>
	:global(:root) {
		--teal: #1f3a3d;
		--teal-deep: #152629;
		--brass: #b08940;
		--brass-bright: #d4a857;
		--ivory: #f1ead8;
		--ivory-muted: #d8cfb4;
		--ink: #0d1518;
	}
	:global(html, body) {
		margin: 0;
		padding: 0;
		min-height: 100vh;
	}
	:global(body) {
		background: var(--teal-deep);
		color: var(--ivory);
		font-family: 'Iowan Old Style', 'Palatino', Georgia, serif;
	}
</style>
