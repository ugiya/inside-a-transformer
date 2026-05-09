import { describe, it, expect } from 'vitest';
import {
	step,
	runSequence,
	counterfactualTrace,
	computeResidualBlooms,
	type Weights
} from './recurrence';
import fixture from './__fixtures__/geron-ch13-rnn.json';

const TOL = 1e-5;

function expectVectorClose(actual: readonly number[], expected: readonly number[], tol = TOL) {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < expected.length; i++) {
		expect(Math.abs(actual[i] - expected[i])).toBeLessThan(tol);
	}
}

describe('recurrence — memory cell forward pass', () => {
	it('runSequence matches Geron Ch.13 PyTorch ground truth (seed=42, N=12, embedDim=4, T=7)', () => {
		const w: Weights = fixture.weights as unknown as Weights;
		const inputs = fixture.inputs as number[][];
		const expected = fixture.expectedTrajectory as number[][];

		const N = fixture.config.N;
		const h0 = new Array<number>(N).fill(0);

		const trajectory = runSequence(h0, inputs, w);

		// Trajectory length = T + 1 (h_0, h_1, ..., h_T)
		expect(trajectory.length).toBe(expected.length);

		// Every hidden state must match PyTorch within float tolerance.
		for (let t = 0; t < expected.length; t++) {
			expectVectorClose(trajectory[t], expected[t]);
		}
	});

	it('counterfactualTrace agrees with runSequence up to dropIndex and diverges after', () => {
		const w: Weights = fixture.weights as unknown as Weights;
		const inputs = fixture.inputs as number[][];
		const N = fixture.config.N;
		const h0 = new Array<number>(N).fill(0);
		const dropIndex = 2;

		const real = runSequence(h0, inputs, w);
		const cf = counterfactualTrace(h0, inputs, w, dropIndex);

		// Up to and including h_{dropIndex} (index dropIndex in trajectory),
		// the dropped input has not yet been consumed, so traces are identical.
		for (let t = 0; t <= dropIndex; t++) {
			expectVectorClose(cf[t], real[t]);
		}

		// At trajectory index dropIndex+1, the dropped input first feeds into
		// the recurrence; cf and real must diverge from this point on.
		for (let t = dropIndex + 1; t < real.length; t++) {
			let maxAbsDiff = 0;
			for (let i = 0; i < real[t].length; i++) {
				maxAbsDiff = Math.max(maxAbsDiff, Math.abs(cf[t][i] - real[t][i]));
			}
			expect(maxAbsDiff).toBeGreaterThan(TOL);
		}
	});

	it('step produces shape-correct output for known fixture', () => {
		// Tiny manual fixture, N=2, embedDim=2.
		// Wx = I, Wh = 0, b = 0 → h_t = tanh(x_t)
		const w: Weights = {
			Wx: [
				[1, 0],
				[0, 1]
			],
			Wh: [
				[0, 0],
				[0, 0]
			],
			b: [0, 0]
		};
		const h = [0, 0];
		const x = [0.5, -0.5];
		const out = step(h, x, w);
		expect(out.length).toBe(2);
		expect(Math.abs(out[0] - Math.tanh(0.5))).toBeLessThan(TOL);
		expect(Math.abs(out[1] - Math.tanh(-0.5))).toBeLessThan(TOL);
	});

	it('computeResidualBlooms returns one entry per counterfactual with magAtStep[t] >= 0', () => {
		const w: Weights = fixture.weights as unknown as Weights;
		const inputs = fixture.inputs as number[][];
		const N = fixture.config.N;
		const T = fixture.config.T;
		const h0 = new Array<number>(N).fill(0);

		const real = runSequence(h0, inputs, w);
		const cfs = inputs.map((_, k) => counterfactualTrace(h0, inputs, w, k));
		const blooms = computeResidualBlooms(real, cfs);

		expect(blooms.length).toBe(T);
		for (const b of blooms) {
			expect(b.magAtStep.length).toBe(real.length);
			for (const m of b.magAtStep) {
				expect(m).toBeGreaterThanOrEqual(0);
			}
		}

		// For each word i, magAtStep[i] should be 0 (cf agrees up to and
		// including step i) and magAtStep[i+1] should be > 0.
		for (let i = 0; i < blooms.length; i++) {
			expect(blooms[i].magAtStep[i]).toBeLessThan(TOL);
			expect(blooms[i].magAtStep[i + 1]).toBeGreaterThan(TOL);
		}
	});
});
