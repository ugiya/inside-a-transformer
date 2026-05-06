import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import AttentionHeatmap from './AttentionHeatmap.svelte';

describe('AttentionHeatmap', () => {
	const tokens = [5, 17, 113];

	it('renders n_ctx x n_ctx (3x3 = 9) cells for a 3x3 pattern', () => {
		const pattern = [
			[1.0, 0.0, 0.0],
			[0.5, 0.5, 0.0],
			[0.2, 0.3, 0.5]
		];
		const { container } = render(AttentionHeatmap, { props: { pattern, tokens } });
		const cells = container.querySelectorAll('[data-heatmap-cell]');
		expect(cells.length).toBe(9);
	});

	it('cell opacity is monotonic in attention weight (higher value -> higher opacity)', () => {
		const pattern = [
			[0.1, 0.5, 0.9],
			[0.0, 0.3, 0.6],
			[0.2, 0.4, 0.8]
		];
		const { container } = render(AttentionHeatmap, { props: { pattern, tokens } });
		const lowCell = container.querySelector(
			'[data-heatmap-cell][data-row="0"][data-col="0"]'
		);
		const midCell = container.querySelector(
			'[data-heatmap-cell][data-row="0"][data-col="1"]'
		);
		const highCell = container.querySelector(
			'[data-heatmap-cell][data-row="0"][data-col="2"]'
		);
		expect(lowCell).not.toBeNull();
		expect(midCell).not.toBeNull();
		expect(highCell).not.toBeNull();

		const lowOpacity = Number(lowCell!.getAttribute('fill-opacity'));
		const midOpacity = Number(midCell!.getAttribute('fill-opacity'));
		const highOpacity = Number(highCell!.getAttribute('fill-opacity'));

		expect(lowOpacity).toBeLessThan(midOpacity);
		expect(midOpacity).toBeLessThan(highOpacity);
	});

	it('encodes the cell value on the data attribute for hover/tooltip', () => {
		const pattern = [
			[0.7, 0.2, 0.1],
			[0.0, 0.0, 0.0],
			[0.0, 0.0, 0.0]
		];
		const { container } = render(AttentionHeatmap, { props: { pattern, tokens } });
		const cell = container.querySelector(
			'[data-heatmap-cell][data-row="0"][data-col="0"]'
		);
		expect(cell).not.toBeNull();
		expect(Number(cell!.getAttribute('data-value'))).toBeCloseTo(0.7, 5);
	});

	it('shows a tooltip with row/col token labels and value when a cell is hovered', async () => {
		const pattern = [
			[0.7, 0.2, 0.1],
			[0.0, 0.5, 0.5],
			[0.0, 0.0, 1.0]
		];
		const { container } = render(AttentionHeatmap, { props: { pattern, tokens } });
		const cell = container.querySelector(
			'[data-heatmap-cell][data-row="1"][data-col="2"]'
		) as SVGElement;
		expect(cell).not.toBeNull();

		await fireEvent.mouseEnter(cell);

		const tip = container.querySelector('[data-heatmap-tooltip]');
		expect(tip).not.toBeNull();
		const text = tip!.textContent ?? '';
		expect(text).toContain('17'); // row token
		expect(text).toContain('113'); // col token
		expect(text).toContain('0.5'); // value
	});
});
