<script lang="ts">
	// Visual zoom + dim that transitions from threshold view (Receiver visible from
	// outside) to first-person inside-the-brass view. PRD #18 ISC-9.
	//
	// Auto-completes after `durationMs` (default 1100ms). Tests pass a short value.
	// Reduced-motion: crossfade replaces zoom (polished in slice #23; here we leave
	// a hook for the polish pass via prefers-reduced-motion media query — a
	// transform=scale(1) under reduced-motion is the basic accessibility floor).
	interface Props {
		onComplete: () => void;
		durationMs?: number;
	}
	let { onComplete, durationMs = 1100 }: Props = $props();

	let mounted = $state(false);

	$effect(() => {
		// Trigger the CSS transition next frame.
		const raf = requestAnimationFrame(() => {
			mounted = true;
		});
		const timer = setTimeout(onComplete, durationMs);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(timer);
		};
	});

	const durationStyle = $derived(`--sink-duration: ${durationMs}ms`);
</script>

<section
	class="sink"
	class:sunk={mounted}
	style={durationStyle}
	data-test="sink-transition"
	aria-hidden="true"
>
	<div class="vignette"></div>
	<div class="iris"></div>
</section>

<style>
	.sink {
		position: relative;
		width: 100%;
		min-height: 320px;
		background: rgba(13, 21, 24, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.vignette {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle at 50% 45%,
			rgba(176, 137, 64, 0.18) 0%,
			rgba(13, 21, 24, 0.95) 60%,
			rgba(13, 21, 24, 1) 100%
		);
		opacity: 0;
		transition: opacity var(--sink-duration) ease-in;
	}
	.iris {
		width: 140px;
		height: 140px;
		border-radius: 50%;
		background: radial-gradient(circle, var(--brass-bright) 0%, var(--brass) 60%, var(--teal-deep) 100%);
		transform: scale(0.4);
		opacity: 0.85;
		transition: transform var(--sink-duration) cubic-bezier(0.4, 0, 0.6, 1),
			opacity var(--sink-duration) ease-in;
	}
	.sunk .vignette {
		opacity: 1;
	}
	.sunk .iris {
		transform: scale(4.5);
		opacity: 0;
	}

	/* Reduced-motion fallback: crossfade only, no transform. */
	@media (prefers-reduced-motion: reduce) {
		.iris {
			transform: scale(1);
			transition: opacity var(--sink-duration) ease-in;
		}
		.sunk .iris {
			transform: scale(1);
			opacity: 0;
		}
	}
</style>
