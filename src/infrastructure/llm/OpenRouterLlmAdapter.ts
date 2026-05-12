import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { z } from 'zod/v3';
import type { LlmPort, StructuredResult } from '../../core/application/ports/LlmPort.ts';
import type { ModelConfig } from '../../shared/config/modelConfig.ts';

export class OpenRouterLlmAdapter implements LlmPort {
    private readonly llmClient: ChatOpenAI;

    constructor(config: ModelConfig) {
        this.llmClient = new ChatOpenAI({
            apiKey: config.apiKey,
            modelName: config.models[0],
            temperature: config.temperature,
            configuration: {
                baseURL: 'https://openrouter.ai/api/v1',
                defaultHeaders: {
                    'HTTP-Referer': config.httpReferer,
                    'X-Title': config.xTitle,
                },
            },
            modelKwargs: {
                models: config.models,
                provider: { sort: 'throughput' },
            },
        });
    }

    async generateStructured<T>(
        systemPrompt: string,
        userPrompt: string,
        schema: z.ZodSchema<T>,
    ): Promise<StructuredResult<T>> {
        try {
            const structuredLlm = this.llmClient.withStructuredOutput(schema as z.ZodSchema, { method: 'jsonMode' });

            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage(userPrompt),
            ];
            const data = await structuredLlm.invoke(messages);
            return {
                success: true,
                data: data as T,
            };
        } catch (error) {
            console.error('OpenRouterLlmAdapter error:', error);
            return {
                success: false,
                data: undefined as unknown as T,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
