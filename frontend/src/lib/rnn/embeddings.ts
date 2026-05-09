/**
 * Word -> embedding lookup for the Last Receiver palette.
 *
 * Mirrors PyTorch's `nn.Embedding(vocab_size, embed_dim)` API conceptually:
 * given a token, return its dense vector. Throws on unknown tokens (no
 * silent fallback) so palette mismatches surface as test failures.
 */

import type { Token } from './transmissions.js';
import { PALETTE } from './transmissions.js';

export function getEmbedding(
  word: string,
  palette: readonly Token[] = PALETTE
): readonly number[] {
  const t = palette.find((p) => p.word === word);
  if (!t) throw new Error(`getEmbedding: unknown word "${word}"`);
  return t.embedding;
}
