import { ChatOpenAI } from '@langchain/openai';
import { createAgent, HumanMessage, providerStrategy, SystemMessage } from 'langchain';
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
            const agent = createAgent({
                model: this.llmClient,
                tools: [],
                responseFormat: providerStrategy(schema),
            });
            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage(userPrompt),
            ];
            const data = await agent.invoke({ messages });
            return {
                success: true,
                data: data.structuredResponse as T,
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
