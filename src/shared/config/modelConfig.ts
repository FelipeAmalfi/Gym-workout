import type { Env } from './env.ts';

export type ModelConfig = {
    apiKey: string;
    httpReferer: string;
    xTitle: string;
    model: string;
    temperature: number;
    embeddingModel: string;
    embeddingDimensions: number;
};

export function buildModelConfig(env: Env): ModelConfig {
    return {
        apiKey: env.OPENROUTER_API_KEY,
        httpReferer: env.HTTP_REFERER,
        xTitle: env.X_TITLE,
        model: env.LLM_MODEL,
        temperature: env.LLM_TEMPERATURE,
        embeddingModel: env.EMBEDDING_MODEL,
        embeddingDimensions: env.EMBEDDING_DIMENSIONS,
    };
}
