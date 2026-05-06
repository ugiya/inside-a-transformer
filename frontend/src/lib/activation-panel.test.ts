import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ActivationPanel from './ActivationPanel.svelte';

describe('ActivationPanel', () => {
	it('renders one bar per value', () => {
		const { container } = render(ActivationPanel, {
			props: { values: [0.1, 0.5, -0.3, 1.2, 0.0] }
		});
		const bars = container.querySelectorAll('[data-bar]');
		expect(bars.length).toBe(5);
	});

	it('bar height is proportional to |value| / max(|values|)', () => {
		const { container } = render(ActivationPanel, {
			props: { values: [0.5, 1.0, 0.25] }
		});
		const bars = container.querySelectorAll<HTMLElement>('[data-bar]');
		const h1 = bars[0].style.getPropertyValue('--bar-h');
		const h2 = bars[1].style.getPropertyValue('--bar-h');
		const h3 = bars[2].style.getPropertyValue('--bar-h');
		expect(h2).toBe('100%');
		expect(h1).toBe('50%');
		expect(h3).toBe('25%');
	});

	it('marks negative values as .negative', () => {
		const { container } = render(ActivationPanel, {
			props: { values: [0.5, -0.5, 0.5] }
		});
		const bars = container.querySelectorAll<HTMLElement>('[data-bar]');
		expect(bars[0].classList.contains('negative')).toBe(false);
		expect(bars[1].classList.contains('negative')).toBe(true);
		expect(bars[2].classList.contains('negative')).toBe(false);
	});

	it('clicking a bar fires onAblate with the correct index', async () => {
		const onAblate = vi.fn();
		const { container } = render(ActivationPanel, {
			props: { values: [0.1, 0.5, 0.9], onAblate }
		});
		const bar2 = container.querySelectorAll<HTMLButtonElement>('[data-bar]')[1];
		await fireEvent.click(bar2);
		expect(onAblate).toHaveBeenCalledOnce();
		expect(onAblate).toHaveBeenCalledWith(1);
	});

	it('marks the ablatedIndex bar with .ablated', () => {
		const { container } = render(ActivationPanel, {
			props: { values: [0.1, 0.5, 0.9], ablatedIndex: 1 }
		});
		const bars = container.querySelectorAll<HTMLElement>('[data-bar]');
		expect(bars[1].classList.contains('ablated')).toBe(true);
		expect(bars[0].classList.contains('ablated')).toBe(false);
	});
});
