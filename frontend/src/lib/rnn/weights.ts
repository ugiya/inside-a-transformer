/**
 * Deterministic weight initialisation for the simple-RNN memory cell used
 * in the Last Receiver game.
 *
 * Three matrices/vectors:
 *   - Wx: (N x embedDim) input-to-hidden projection
 *   - Wh: (N x N)        hidden-to-hidden recurrent projection
 *   - b:  (N)            bias added before tanh
 *
 * Mathematically equivalent to Geron's `nn.Linear(input_size + hidden_size,
 * hidden_size)` (Hands-On ML Ch. 13) where the single weight matrix W is
 * sliced as [W_x | W_h]. Our separated form is easier to teach via the
 * existing math explainer panel below the game.
 *
 * Stub for slice #19 tracer bullet: returns shape-correct zero-or-uniform
 * tensors; fully implemented in a later RED-GREEN cycle of slice #19.
 */

export interface Weights {
  readonly Wx: readonly (readonly number[])[]; // [N][embedDim]
  readonly Wh: readonly (readonly number[])[]; // [N][N]
  readonly b: readonly number[]; // [N]
}

import { mulberry32 } from './prng.js';

/**
 * Initialise weights with small uniform values in [-scale, +scale].
 * Default scale matches the magnitude PyTorch's `nn.Linear` uses for similar
 * fan-in (~sqrt(1/fan_in)).
 */
export function initWeights(N: number, embedDim: number, seed: number): Weights {
  const rng = mulberry32(seed);
  const fanIn = embedDim + N;
  const scale = 1 / Math.sqrt(fanIn);
  const sample = () => (rng() * 2 - 1) * scale;

  const Wx: number[][] = Array.from({ length: N }, () =>
    Array.from({ length: embedDim }, sample)
  );
  const Wh: number[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, sample)
  );
  const b: number[] = Array.from({ length: N }, sample);
  return { Wx, Wh, b };
}
