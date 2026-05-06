import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { flushSync, tick } from 'svelte';

import VectorPrimitive from './VectorPrimitive.svelte';
import DotProductPrimitive from './DotProductPrimitive.svelte';
import MatrixVectorPrimitive from './MatrixVectorPrimitive.svelte';
import SinCosPrimitive from './SinCosPrimitive.svelte';
import UnitCirclePrimitive from './UnitCirclePrimitive.svelte';

// jsdom doesn't implement getBoundingClientRect on SVG; stub a deterministic 360×360 box
// at (0,0). Same box for every test using these primitives.
function stubSvgRect(size: number) {
	// `size` is the SVG's logical viewBox edge — match it 1:1 to client px so coords are 1:1.
	Element.prototype.getBoundingClientRect = function () {
		return {
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			right: size,
			bottom: size,
			width: size,
			height: size,
			toJSON: () => ({})
		} as DOMRect;
	};
}

describe('VectorPrimitive (P1)', () => {
	beforeEach(() => stubSvgRect(360));

	it('updates the displayed components when the user drags the tip', async () => {
		const { container } = render(VectorPrimitive);
		const svg = container.querySelector('svg.plane') as SVGSVGElement;
		expect(svg).not.toBeNull();

		// SVG center is (180, 180). UNIT = 60. Drag to (240, 120) ⇒ math (1.0, 1.0).
		await fireEvent.pointerDown(svg, { clientX: 240, clientY: 120, pointerId: 1 });
		flushSync();

		const x = container.querySelector('[data-test="vec-x"]')?.textContent ?? '';
		const y = container.querySelector('[data-test="vec-y"]')?.textContent ?? '';
		const m = container.querySelector('[data-test="vec-mag"]')?.textContent ?? '';
		expect(x).toContain('x = 1.0');
		expect(y).toContain('y = 1.0');
		// |v| = sqrt(2) ≈ 1.4 with one decimal.
		expect(m).toContain('|v| = 1.4');
	});
});

describe('DotProductPrimitive (P3)', () => {
	beforeEach(() => stubSvgRect(360));

	it('renders both arrow heads and computes a default positive dot product', () => {
		const { container } = render(DotProductPrimitive);

		expect(container.querySelector('[data-test="arrow-a-head"]')).not.toBeNull();
		expect(container.querySelector('[data-test="arrow-b-head"]')).not.toBeNull();

		// Defaults: a = (2.5, 1.0), b = (1.0, 2.5). a·b = 2.5 + 2.5 = 5.00.
		const dotText = container.querySelector('[data-test="dot-value"]')?.textContent ?? '';
		expect(dotText).toContain('a · b = 5.00');

		const caption = container.querySelector('[data-test="dot-caption"]')?.textContent ?? '';
		expect(caption.toLowerCase()).toContain('aligned');
	});
});

describe('MatrixVectorPrimitive (P2)', () => {
	it('updates y entries deterministically when an x slider changes', async () => {
		const { container } = render(MatrixVectorPrimitive);

		// Initial defaults: x = [1, 2, 3, 0]; A defined inline:
		// row 0 = [2, -1, 0.5, 3] ⇒ y0 = 2 -2 + 1.5 + 0 = 1.5
		// row 1 = [0,  4, -2,  1] ⇒ y1 = 0 + 8 - 6 + 0 = 2
		// row 2 = [1,  1,  1,  1] ⇒ y2 = 1 + 2 + 3 + 0 = 6
		expect(container.querySelector('[data-test="y-val-0"]')?.textContent).toBe('1.5');
		expect(container.querySelector('[data-test="y-val-1"]')?.textContent).toBe('2');
		expect(container.querySelector('[data-test="y-val-2"]')?.textContent).toBe('6');

		// Change x[0] from 1 → 2. New y0 = 4 -2 + 1.5 + 0 = 3.5; y1 unchanged (0·x[0]=0); y2 = 2+2+3+0=7.
		const x0 = container.querySelector('[data-test="x-input-0"]') as HTMLInputElement;
		expect(x0).not.toBeNull();
		await fireEvent.input(x0, { target: { value: '2' } });
		flushSync();
		await tick();

		expect(container.querySelector('[data-test="y-val-0"]')?.textContent).toBe('3.5');
		expect(container.querySelector('[data-test="y-val-1"]')?.textContent).toBe('2');
		expect(container.querySelector('[data-test="y-val-2"]')?.textContent).toBe('7');
	});
});

describe('SinCosPrimitive (P4)', () => {
	it('updates cos and sin readouts when θ changes via the slider', async () => {
		const { container } = render(SinCosPrimitive);

		const slider = container.querySelector('[data-test="theta-slider"]') as HTMLInputElement;
		expect(slider).not.toBeNull();

		// θ = 0 ⇒ cos = 1.00, sin = 0.00
		await fireEvent.input(slider, { target: { value: '0' } });
		flushSync();
		expect(container.querySelector('[data-test="cos-readout"]')?.textContent).toContain('1.00');
		expect(container.querySelector('[data-test="sin-readout"]')?.textContent).toContain('0.00');

		// θ = π/2 ⇒ cos ≈ 0.00, sin ≈ 1.00
		await fireEvent.input(slider, { target: { value: String(Math.PI / 2) } });
		flushSync();
		expect(container.querySelector('[data-test="cos-readout"]')?.textContent).toContain('0.00');
		expect(container.querySelector('[data-test="sin-readout"]')?.textContent).toContain('1.00');
	});
});

describe('UnitCirclePrimitive (P5)', () => {
	beforeEach(() => stubSvgRect(320));

	it('cos/sin readouts match the geometric position when the point is dragged', async () => {
		const { container } = render(UnitCirclePrimitive);

		const svg = container.querySelector('svg.circle') as SVGSVGElement;
		expect(svg).not.toBeNull();

		// Origin = (160, 160). Drag to (260, 160): direction +x ⇒ θ = 0 ⇒ cos = 1.00, sin = 0.00
		await fireEvent.pointerDown(svg, { clientX: 260, clientY: 160, pointerId: 1 });
		flushSync();
		expect(container.querySelector('[data-test="cos-readout"]')?.textContent).toContain('1.00');
		expect(container.querySelector('[data-test="sin-readout"]')?.textContent).toContain('0.00');

		// Drag to (160, 60): direction +y ⇒ θ = π/2 ⇒ cos ≈ 0.00, sin ≈ 1.00
		await fireEvent.pointerMove(svg, { clientX: 160, clientY: 60, pointerId: 1 });
		flushSync();
		expect(container.querySelector('[data-test="cos-readout"]')?.textContent).toContain('0.00');
		expect(container.querySelector('[data-test="sin-readout"]')?.textContent).toContain('1.00');

		// Narrator line should now be visible.
		expect(container.querySelector('[data-test="narrator"]')).not.toBeNull();
	});
});

// --- Room sequencing + skip behaviour ----------------------------------------

// Mock $app/navigation so we can assert goto() side-effects without SvelteKit runtime.
const gotoMock = vi.fn();
vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => gotoMock(...args)
}));

// Defer importing the page to AFTER the mock is registered.
import MathAntechamberPage from '../../routes/math-antechamber/+page.svelte';
import LobbyPage from '../../routes/+page.svelte';
import { gameState } from '../gameState.svelte';

describe('Math Antechamber room', () => {
	beforeEach(() => {
		gotoMock.mockClear();
		gameState.setMathAntechamberSkipped(false);
	});

	it('renders P1 (Vector) first, and Next advances to P3 (Dot product)', async () => {
		const { container } = render(MathAntechamberPage);

		// Step 0 should be Vector.
		expect(container.querySelector('[data-test="scene-title"]')?.textContent).toContain('Vector');
		expect(container.querySelector('[data-test="vector-primitive"]')).not.toBeNull();
		expect(container.querySelector('[data-test="dotprod-primitive"]')).toBeNull();

		// Click Next → step 1 (Dot product).
		const next = container.querySelector('[data-test="next-button"]') as HTMLButtonElement;
		await fireEvent.click(next);
		flushSync();
		await tick();

		expect(container.querySelector('[data-test="scene-title"]')?.textContent).toContain(
			'Dot product'
		);
		expect(container.querySelector('[data-test="dotprod-primitive"]')).not.toBeNull();
		expect(container.querySelector('[data-test="vector-primitive"]')).toBeNull();
	});

	it('Skip button persists mathAntechamberSkipped and navigates to /embedding-garden', async () => {
		const { container } = render(MathAntechamberPage);

		const skipBtn = container.querySelector('[data-test="skip-button"]') as HTMLButtonElement;
		expect(skipBtn).not.toBeNull();

		await fireEvent.click(skipBtn);
		flushSync();

		expect(gameState.mathAntechamberSkipped).toBe(true);
		expect(gotoMock).toHaveBeenCalledWith('/embedding-garden');
	});
});

describe('Lobby — math-antechamber surface', () => {
	it('exposes Math Antechamber as a clickable enter-link to /math-antechamber', () => {
		const { container } = render(LobbyPage);
		const link = container.querySelector('a[href="/math-antechamber"]');
		expect(link).not.toBeNull();
		expect(link?.textContent ?? '').toContain('Math Antechamber');
	});
});
