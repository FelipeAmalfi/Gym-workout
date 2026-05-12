import { z } from 'zod/v3';

export const SummarySchema = z.object({
    user_facts: z.array(z.string()).describe('Stable facts about the user (goals, constraints, identity).'),
    decisions: z.array(z.string()).describe('Decisions or preferences locked in during the conversation.'),
    unresolved_questions: z.array(z.string()).describe('Open questions or pending follow-ups.'),
    notes: z.string().nullish().describe('Any extra short note worth carrying forward.'),
});

export type SummaryData = z.infer<typeof SummarySchema>;

export const getSystemPrompt = () => JSON.stringify({
    role: 'Conversation Summarizer',
    task: 'Compress a slice of a workout-assistant conversation into structured notes for long-term memory',
    constraints: [
        'Output four short lists. Each item is a single sentence.',
        'Do NOT restate small talk, greetings, or already-resolved exchanges.',
        'Carry forward only information that helps future turns: user facts, locked-in decisions, open questions.',
        'Never invent details that are not in the transcript.',
        'Keep the entire output under ~250 tokens.',
    ],
});

export const getUserPromptTemplate = (data: {
    transcript: string;
    priorSummary?: string;
}) => JSON.stringify({
    prior_summary: data.priorSummary ?? null,
    transcript_to_compress: data.transcript,
    instructions: [
        'Merge the prior_summary with new information from transcript_to_compress.',
        'Drop redundant or stale items. Keep the lists tight.',
    ],
});

export function renderSummary(data: SummaryData): string {
    const sections: string[] = [];
    if (data.user_facts.length) sections.push(`User facts:\n- ${data.user_facts.join('\n- ')}`);
    if (data.decisions.length) sections.push(`Decisions:\n- ${data.decisions.join('\n- ')}`);
    if (data.unresolved_questions.length) sections.push(`Open questions:\n- ${data.unresolved_questions.join('\n- ')}`);
    if (data.notes) sections.push(`Notes: ${data.notes}`);
    return sections.join('\n\n');
}
