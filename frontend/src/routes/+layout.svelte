<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { palette } from '$lib/style';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Transformer Rooms</title>
</svelte:head>

<div class="root" style:--teal={palette.teal} style:--teal-deep={palette.tealDeep} style:--brass={palette.brass} style:--brass-bright={palette.brassBright} style:--ivory={palette.ivory} style:--ivory-muted={palette.ivoryMuted} style:--ink={palette.ink}>
	{@render children()}
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		min-height: 100vh;
	}
	:global(body) {
		background: var(--teal-deep, #152629);
		color: var(--ivory, #f1ead8);
		font-family: 'Iowan Old Style', 'Palatino', Georgia, serif;
	}
	.root {
		min-height: 100vh;
	}
</style>
