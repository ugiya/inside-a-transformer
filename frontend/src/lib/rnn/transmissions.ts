/**
 * Transmission palette for the "Last Receiver" Hall of Memory game.
 *
 * 14 English story words split into two semantic clusters:
 *   - tactical: words a wireless operator might receive about a siege
 *     (positions, supplies, timing)
 *   - personal: words a survivor might dictate as a final message
 *     (relations, emotions, requests)
 *
 * Each word has a hand-tuned 4-D embedding placing tactical and personal
 * tokens in distinct regions of the embedding space. The hand-tuning is so
 * that:
 *   - same-type cosine similarity is HIGHER than cross-type cosine similarity
 *   - the simple RNN we use for the game can produce visibly different
 *     residue glow patterns for tactical vs personal traces
 *
 * The palette is intentionally small (14) so the player can recognise specific
 * words during the recall test rather than guessing at random integers. The
 * lab's actual transformer trains on integers 0..112 (mod 113); a future V2
 * "hard mode" can swap this palette for an integer-token palette.
 */

export type TokenType = 'tactical' | 'personal';

export interface Token {
  readonly word: string;
  readonly embedding: readonly number[]; // 4-D vector
  readonly type: TokenType;
}

export const EMBED_DIM = 4 as const;

export const PALETTE: readonly Token[] = [
  // Tactical cluster — first two dims +ve, last two dims -ve.
  { word: 'bridge', embedding: [0.9, 0.7, -0.3, -0.5], type: 'tactical' },
  { word: 'troops', embedding: [0.8, 0.9, -0.4, -0.4], type: 'tactical' },
  { word: 'supply', embedding: [0.7, 0.6, -0.2, -0.5], type: 'tactical' },
  { word: 'signal', embedding: [0.9, 0.5, -0.5, -0.3], type: 'tactical' },
  { word: 'west', embedding: [0.6, 0.8, -0.3, -0.6], type: 'tactical' },
  { word: 'dawn', embedding: [0.8, 0.6, -0.4, -0.4], type: 'tactical' },
  { word: 'silent', embedding: [0.7, 0.7, -0.5, -0.5], type: 'tactical' },
  // Personal cluster — first two dims -ve, last two dims +ve.
  { word: 'mother', embedding: [-0.4, -0.5, 0.9, 0.7], type: 'personal' },
  { word: 'name', embedding: [-0.3, -0.4, 0.8, 0.9], type: 'personal' },
  { word: 'song', embedding: [-0.5, -0.3, 0.7, 0.8], type: 'personal' },
  { word: 'forgive', embedding: [-0.4, -0.6, 0.9, 0.6], type: 'personal' },
  { word: 'return', embedding: [-0.5, -0.5, 0.8, 0.7], type: 'personal' },
  { word: 'wait', embedding: [-0.3, -0.5, 0.6, 0.8], type: 'personal' },
  { word: 'home', embedding: [-0.6, -0.4, 0.7, 0.9], type: 'personal' }
] as const;

import { mulberry32 } from './prng.js';

/**
 * Draw T words from the palette using a seeded PRNG.
 * Returns exactly T words (with repetition allowed).
 */
export function generateTransmission(
  palette: readonly Token[],
  T: number,
  seed: number
): string[] {
  const rng = mulberry32(seed);
  const words: string[] = [];
  for (let i = 0; i < T; i++) {
    const idx = Math.floor(rng() * palette.length);
    words.push(palette[idx].word);
  }
  return words;
}
