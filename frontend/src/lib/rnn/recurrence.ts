/**
 * The memory cell — one tick of the simple RNN forward pass.
 *
 * Three independent sources name this object the same: Maarek's AWS-MLS-C01
 * cert lecture (Section 04, lecture 05) calls it a "memory cell"; Geron's
 * Hands-On ML Ch. 13 names it `memory_cell` in his `SimpleRnnModel`; @uri-gil
 * studied both. The vocabulary is canonical.
 *
 * Math (per the on-page explainer at /hall-of-memory):
 *
 *   h_t = tanh( W_x · x_t  +  W_h · h_{t-1}  +  b )
 *
 * Mathematically equivalent to Geron's concatenated form
 *   h_t = tanh( W · concat(x_t, h_{t-1}) + b )
 * with W sliced as [W_x | W_h]. The separated form is used here because the
 * existing textual explainer below the game references W_x, W_h, and b by
 * name — the code mirrors the explanation.
 *
 * Slice #19: tracer bullet stub. Full implementation lands in a subsequent
 * RED-GREEN cycle once the PyTorch ground-truth fixture is generated.
 */

import type { Weights } from './weights.js';

export type { Weights };

export interface Residue {
  readonly wordIndex: number;
  readonly magAtStep: readonly number[];
}

/**
 * One memory-cell update. Produces h_t from h_{t-1} and the current input x_t.
 */
export function step(
  h: readonly number[],
  x: readonly number[],
  w: Weights
): number[] {
  const N = w.Wx.length;
  const out: number[] = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    let sum = w.b[i];
    const wxRow = w.Wx[i];
    for (let j = 0; j < x.length; j++) sum += wxRow[j] * x[j];
    const whRow = w.Wh[i];
    for (let j = 0; j < N; j++) sum += whRow[j] * h[j];
    out[i] = Math.tanh(sum);
  }
  return out;
}

/**
 * Run the memory cell forward for the entire input sequence.
 * Returns trajectory [h_0, h_1, ..., h_T] of length T+1 where h_0 is `h0`.
 */
export function runSequence(
  h0: readonly number[],
  xSeq: readonly (readonly number[])[],
  w: Weights
): number[][] {
  const trajectory: number[][] = [Array.from(h0)];
  let h: number[] = Array.from(h0);
  for (const x of xSeq) {
    h = step(h, x, w);
    trajectory.push(h);
  }
  return trajectory;
}

/**
 * Run the same forward pass but with the input at position `dropIndex`
 * replaced by a zero vector. Used to compute the "surviving contribution"
 * of a given past word at later timesteps.
 */
export function counterfactualTrace(
  h0: readonly number[],
  xSeq: readonly (readonly number[])[],
  w: Weights,
  dropIndex: number
): number[][] {
  const embedDim = xSeq.length > 0 ? xSeq[0].length : 0;
  const zero: number[] = new Array<number>(embedDim).fill(0);
  const modified = xSeq.map((x, i) => (i === dropIndex ? zero : x));
  return runSequence(h0, modified, w);
}

/**
 * For each past word i, compute |h_t - h_t_drop_i|_2 at every step t.
 * Used to drive the residue-glow visualisation: bright glow = the model
 * still "feels" word i strongly; dim glow = its trace has been overwritten.
 */
export function computeResidualBlooms(
  real: readonly (readonly number[])[],
  counterfactuals: readonly (readonly (readonly number[])[])[]
): Residue[] {
  const blooms: Residue[] = [];
  for (let i = 0; i < counterfactuals.length; i++) {
    const cf = counterfactuals[i];
    const mag: number[] = [];
    for (let t = 0; t < real.length; t++) {
      const r = real[t];
      const c = cf[t];
      let s = 0;
      for (let k = 0; k < r.length; k++) {
        const d = r[k] - c[k];
        s += d * d;
      }
      mag.push(Math.sqrt(s));
    }
    blooms.push({ wordIndex: i, magAtStep: mag });
  }
  return blooms;
}
