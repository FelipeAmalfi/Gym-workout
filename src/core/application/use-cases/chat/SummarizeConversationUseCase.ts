import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import type { LlmPort } from '../../ports/LlmPort.ts';
import {
    SummarySchema,
    getSystemPrompt,
    getUserPromptTemplate,
    renderSummary,
} from '../../../../shared/prompts/v1/summarize.ts';

export interface SummarizeInput {
    messages: BaseMessage[];
    priorSummary?: string;
}

export interface SummarizeOutput {
    summary: string;
    turnsCovered: number;
}

function messageRole(msg: BaseMessage): string {
    if (msg instanceof HumanMessage) return 'user';
    if (msg instanceof AIMessage) return 'assistant';
    return 'system';
}

function messageText(msg: BaseMessage): string {
    return typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
}

export class SummarizeConversationUseCase {
    private readonly llm: LlmPort;
    constructor(llm: LlmPort) { this.llm = llm; }

    async execute(input: SummarizeInput): Promise<SummarizeOutput> {
        if (input.messages.length === 0) {
            return { summary: input.priorSummary ?? '', turnsCovered: 0 };
        }

        const transcript = input.messages
            .map((m) => `${messageRole(m)}: ${messageText(m)}`)
            .join('\n');

        const result = await this.llm.generateStructured(
            getSystemPrompt(),
            getUserPromptTemplate({ transcript, priorSummary: input.priorSummary }),
            SummarySchema,
        );

        if (!result.success || !result.data) {
            return {
                summary: input.priorSummary ?? '',
                turnsCovered: 0,
            };
        }

        return {
            summary: renderSummary(result.data),
            turnsCovered: input.messages.length,
        };
    }
}
