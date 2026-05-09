import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Receiver from './Receiver.svelte';

describe('Receiver — clockpunk memory-engine body', () => {
	it('TRACER: renders one dial per N when given N=12 with zero h and no residues', () => {
		const { container } = render(Receiver, {
			props: {
				N: 12,
				h: new Array<number>(12).fill(0),
				residues: []
			}
		});
		const dials = container.querySelectorAll('[data-test="dial"]');
		expect(dials.length).toBe(12);
	});

	it('renders the right number of dials at the layout extremes (N=4 and N=32)', () => {
		for (const N of [4, 32]) {
			const { container } = render(Receiver, {
				props: { N, h: new Array<number>(N).fill(0), residues: [] }
			});
			expect(container.querySelectorAll('[data-test="dial"]').length).toBe(N);
		}
	});

	it('each dial exposes its h[i] value via data-value (in props order)', () => {
		const h = [0.1, 0.5, -0.3, 0.8];
		const { container } = render(Receiver, {
			props: { N: 4, h, residues: [] }
		});
		const dials = Array.from(container.querySelectorAll('[data-test="dial"]'));
		expect(dials.length).toBe(4);
		for (let i = 0; i < dials.length; i++) {
			const v = dials[i].getAttribute('data-value');
			expect(v).not.toBeNull();
			expect(Number(v)).toBeCloseTo(h[i], 5);
		}
	});

	it('renders one residue-bloom per residues entry (and zero when residues is empty)', () => {
		const { container: empty } = render(Receiver, {
			props: { N: 12, h: new Array<number>(12).fill(0), residues: [] }
		});
		expect(empty.querySelectorAll('[data-test="residue-bloom"]').length).toBe(0);

		const { container: bloomed } = render(Receiver, {
			props: {
				N: 12,
				h: new Array<number>(12).fill(0),
				residues: [
					{ wordIndex: 0, hue: 30, intensity: 0.4 },
					{ wordIndex: 1, hue: 200, intensity: 0.7 }
				]
			}
		});
		expect(bloomed.querySelectorAll('[data-test="residue-bloom"]').length).toBe(2);
	});
});
