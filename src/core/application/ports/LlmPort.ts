import type { z } from 'zod/v3';

export interface StructuredResult<T> {
    success: boolean;
    data: T;
    error?: string;
}

export interface LlmPort {
    generateStructured<T>(
        systemPrompt: string,
        userPrompt: string,
        schema: z.ZodSchema<T>,
    ): Promise<StructuredResult<T>>;
}
