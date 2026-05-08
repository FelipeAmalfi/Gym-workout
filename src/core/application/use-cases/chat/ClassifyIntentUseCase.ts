import type { LlmPort } from '../../ports/LlmPort.ts';
import {
    IntentSchema,
    getSystemPrompt,
    getUserPromptTemplate,
    type IntentData,
} from '../../../../shared/prompts/v1/identifyIntent.ts';
import { LlmError } from '../../../domain/errors/AppError.ts';

export interface ClassifyIntentInput {
    message: string;
    priorIntent?: string;
    priorAssistantMessage?: string;
    hasPendingWorkoutList?: boolean;
}

export class ClassifyIntentUseCase {
    private readonly llm: LlmPort;
    constructor(llm: LlmPort) { this.llm = llm; }

    async execute(input: ClassifyIntentInput): Promise<IntentData> {
        const system = getSystemPrompt();
        const user = getUserPromptTemplate(input);

        const result = await this.llm.generateStructured(system, user, IntentSchema);
        if (!result.success || !result.data) {
            throw new LlmError(result.error ?? 'Intent classification failed');
        }
        return result.data;
    }
}
