import type { LlmPort } from '../../ports/LlmPort.ts';
import {
    MessageSchema,
    getSystemPrompt,
    getUserPromptTemplate,
} from '../../../../shared/prompts/v1/messageGenerator.ts';

export interface GenerateMessageInput {
    scenario: string;
    details: Record<string, unknown>;
}

export class GenerateMessageUseCase {
    private readonly llm: LlmPort;
    constructor(llm: LlmPort) { this.llm = llm; }

    async execute(input: GenerateMessageInput): Promise<string> {
        const system = getSystemPrompt();
        const user = getUserPromptTemplate(input);

        const result = await this.llm.generateStructured(system, user, MessageSchema);
        if (!result.success || !result.data) {
            return 'Sorry, I encountered an issue generating a response. Please try again.';
        }
        return result.data.message;
    }
}
