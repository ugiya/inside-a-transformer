import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('Hall of Memory page', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders without crashing on mount', () => {
		const { container } = render(Page);
		expect(container.querySelector('main')).not.toBeNull();
	});

	it('renders an RNN-cell-chain diorama with multiple cells', () => {
		const { container } = render(Page);
		const cells = container.querySelectorAll('[data-rnn-cell]');
		expect(cells.length).toBeGreaterThanOrEqual(4);
	});

	it('renders a memory packet for each cell that visibly degrades step by step', () => {
		const { container } = render(Page);
		const packets = Array.from(
			container.querySelectorAll<SVGElement>('[data-memory-packet]')
		);
		expect(packets.length).toBeGreaterThanOrEqual(4);

		const opacities = packets.map((p) => Number(p.getAttribute('opacity')));
		// Opacity must monotonically decrease (memory degrading along the chain).
		for (let i = 1; i < opacities.length; i++) {
			expect(opacities[i]).toBeLessThan(opacities[i - 1]);
		}
		// And the last packet must be visibly faded.
		expect(opacities[opacities.length - 1]).toBeLessThan(0.5);
	});

	it('shows the narrator lines about how machines used to read', () => {
		const { container } = render(Page);
		const text = container.textContent ?? '';
		expect(text.toLowerCase()).toContain('this is how machines used to read');
		expect(text.toLowerCase()).toContain(
			'what if every word could just see every other word'
		);
	});

	it('has a door element that advances to /attention-hall', () => {
		const { container } = render(Page);
		const door = container.querySelector('[data-door]');
		expect(door).not.toBeNull();
		expect(door?.getAttribute('href')).toBe('/attention-hall');
	});

	// The Last Receiver game element renders at the top of <main>, before
	// the pedagogy explainer. Originally added as the slice #19 tracer bullet;
	// remains the integration invariant after slice #21-23 land the full game.
	it('renders the Last Receiver at the top of <main>, before the explainer', () => {
		const { container } = render(Page);
		const main = container.querySelector('main');
		expect(main).not.toBeNull();

		const lastReceiver = main!.querySelector('[data-test="last-receiver"]');
		expect(lastReceiver).not.toBeNull();

		const explainer = main!.querySelector('[data-test="rnn-explainer"]');
		expect(explainer).not.toBeNull();

		// Last Receiver must come BEFORE the explainer in document order.
		const position = lastReceiver!.compareDocumentPosition(explainer!);
		// Node.DOCUMENT_POSITION_FOLLOWING = 4 → explainer follows lastReceiver
		expect(position & 4).toBe(4);
	});

	it('mounts on default phase (threshold) with no console errors', () => {
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { container } = render(Page);

		// On default render, LastReceiver enters the threshold phase.
		const lastReceiver = container.querySelector('[data-test="last-receiver"]');
		expect(lastReceiver?.getAttribute('data-phase')).toBe('threshold');
		// Threshold UI is rendered (N/T sliders, begin button).
		expect(container.querySelector('[data-test="threshold"]')).not.toBeNull();
		expect(container.querySelector('[data-test="threshold-begin"]')).not.toBeNull();

		// No console.error calls during mount.
		expect(errSpy).not.toHaveBeenCalled();
	});
});
