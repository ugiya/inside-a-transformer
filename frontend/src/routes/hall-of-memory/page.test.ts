import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('Hall of Memory page', () => {
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
});
