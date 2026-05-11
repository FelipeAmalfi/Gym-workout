import type { EmbeddingsInterface } from '@langchain/core/embeddings';
import { createHash } from 'node:crypto';

/**
 * Deterministic embedding: same text always yields the same vector.
 * The vector is built from sha256(text) bytes, mapped to [-1, 1].
 * Vectors are L2-normalized so cosine similarity behaves predictably.
 */
export function hashToVector(text: string, dims = 8): number[] {
    const out: number[] = [];
    let counter = 0;
    while (out.length < dims) {
        const h = createHash('sha256').update(`${text}::${counter++}`).digest();
        for (let i = 0; i < h.length && out.length < dims; i++) {
            out.push((h[i]! - 128) / 128);
        }
    }
    // L2 normalize
    let norm = Math.sqrt(out.reduce((acc, v) => acc + v * v, 0));
    if (norm === 0) norm = 1;
    return out.map((v) => v / norm);
}

export class MockEmbedder implements EmbeddingsInterface {
    constructor(private readonly dims = 8) {}
    async embedQuery(text: string): Promise<number[]> {
        return hashToVector(text, this.dims);
    }
    async embedDocuments(texts: string[]): Promise<number[][]> {
        return texts.map((t) => hashToVector(t, this.dims));
    }
}
