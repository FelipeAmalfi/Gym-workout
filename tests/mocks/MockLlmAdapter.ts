import type { z } from 'zod/v3';
import type { LlmPort, StructuredResult } from '../../src/core/application/ports/LlmPort.ts';

export type SchemaKind = 'intent' | 'message' | 'summary' | 'unknown';

export interface LlmCall {
    kind: SchemaKind;
    systemPrompt: string;
    userPrompt: string;
}

export interface IntentResponse {
    intent: 'create_workout' | 'update_workout' | 'delete_workout' | 'get_workout' | 'list_workouts' | 'unknown';
    slots?: Record<string, unknown>;
}

export interface MessageResponse {
    message: string;
}

export interface SummaryResponse {
    user_facts: string[];
    decisions: string[];
    unresolved_questions: string[];
    notes?: string;
}

type Matcher = (userPrompt: string) => boolean;

interface IntentRule {
    match: Matcher;
    response: IntentResponse | ((userPrompt: string) => IntentResponse);
}
interface MessageRule {
    match: Matcher;
    response: MessageResponse | ((userPrompt: string) => MessageResponse);
}
interface SummaryRule {
    match: Matcher;
    response: SummaryResponse | ((userPrompt: string) => SummaryResponse);
}

const DEFAULT_INTENT: IntentResponse = { intent: 'unknown', slots: {} };
const DEFAULT_MESSAGE: MessageResponse = { message: 'Default mock assistant reply.' };
const DEFAULT_SUMMARY: SummaryResponse = {
    user_facts: [],
    decisions: [],
    unresolved_questions: [],
};

/**
 * Detects which prompt schema is being used by inspecting Zod shape keys.
 * No runtime LLM is called — all responses are scripted from the test.
 */
export function detectSchemaKind(schema: z.ZodSchema<unknown>): SchemaKind {
    // ZodObject exposes shape via _def.shape() in zod/v3.
    const anyDef = (schema as unknown as { _def?: { shape?: () => Record<string, unknown> } })._def;
    const shape = typeof anyDef?.shape === 'function' ? anyDef.shape() : undefined;
    if (!shape) return 'unknown';
    if ('intent' in shape && 'slots' in shape) return 'intent';
    if ('message' in shape && Object.keys(shape).length === 1) return 'message';
    if ('user_facts' in shape && 'decisions' in shape) return 'summary';
    return 'unknown';
}

export class MockLlmAdapter implements LlmPort {
    readonly calls: LlmCall[] = [];

    private intentRules: IntentRule[] = [];
    private messageRules: MessageRule[] = [];
    private summaryRules: SummaryRule[] = [];

    private intentDefault: IntentResponse = DEFAULT_INTENT;
    private messageDefault: MessageResponse = DEFAULT_MESSAGE;
    private summaryDefault: SummaryResponse = DEFAULT_SUMMARY;

    /** Enqueue an intent response. Matcher receives the userPrompt JSON. */
    onIntent(match: Matcher | RegExp | string, response: IntentRule['response']): this {
        this.intentRules.push({ match: toMatcher(match), response });
        return this;
    }
    /** Enqueue a message response for a given scenario or matcher. */
    onMessage(match: Matcher | RegExp | string, response: MessageRule['response']): this {
        this.messageRules.push({ match: toMatcher(match), response });
        return this;
    }
    /** Enqueue a summary response. */
    onSummary(match: Matcher | RegExp | string, response: SummaryRule['response']): this {
        this.summaryRules.push({ match: toMatcher(match), response });
        return this;
    }

    defaultIntent(response: IntentResponse): this { this.intentDefault = response; return this; }
    defaultMessage(response: MessageResponse): this { this.messageDefault = response; return this; }
    defaultSummary(response: SummaryResponse): this { this.summaryDefault = response; return this; }

    intentCalls(): LlmCall[] { return this.calls.filter((c) => c.kind === 'intent'); }
    messageCalls(): LlmCall[] { return this.calls.filter((c) => c.kind === 'message'); }
    summaryCalls(): LlmCall[] { return this.calls.filter((c) => c.kind === 'summary'); }

    /** Returns the last userPrompt of the given kind, parsed as JSON. */
    lastPromptOf(kind: SchemaKind): Record<string, unknown> | null {
        const calls = this.calls.filter((c) => c.kind === kind);
        const last = calls.at(-1);
        if (!last) return null;
        try { return JSON.parse(last.userPrompt); } catch { return null; }
    }

    reset(): void {
        this.calls.length = 0;
        this.intentRules = [];
        this.messageRules = [];
        this.summaryRules = [];
        this.intentDefault = DEFAULT_INTENT;
        this.messageDefault = DEFAULT_MESSAGE;
        this.summaryDefault = DEFAULT_SUMMARY;
    }

    async generateStructured<T>(
        systemPrompt: string,
        userPrompt: string,
        schema: z.ZodSchema<T>,
    ): Promise<StructuredResult<T>> {
        const kind = detectSchemaKind(schema as z.ZodSchema<unknown>);
        this.calls.push({ kind, systemPrompt, userPrompt });

        let data: unknown;
        if (kind === 'intent') {
            const rule = this.intentRules.find((r) => r.match(userPrompt));
            data = rule
                ? (typeof rule.response === 'function' ? rule.response(userPrompt) : rule.response)
                : this.intentDefault;
        } else if (kind === 'message') {
            const rule = this.messageRules.find((r) => r.match(userPrompt));
            data = rule
                ? (typeof rule.response === 'function' ? rule.response(userPrompt) : rule.response)
                : this.messageDefault;
        } else if (kind === 'summary') {
            const rule = this.summaryRules.find((r) => r.match(userPrompt));
            data = rule
                ? (typeof rule.response === 'function' ? rule.response(userPrompt) : rule.response)
                : this.summaryDefault;
        } else {
            return {
                success: false,
                data: undefined as unknown as T,
                error: `MockLlmAdapter: unknown schema kind (no shape keys matched)`,
            };
        }

        const parsed = schema.safeParse(data);
        if (!parsed.success) {
            return {
                success: false,
                data: undefined as unknown as T,
                error: `MockLlmAdapter: scripted response failed schema parse: ${parsed.error.message}`,
            };
        }
        return { success: true, data: parsed.data };
    }
}

function toMatcher(m: Matcher | RegExp | string): Matcher {
    if (typeof m === 'function') return m;
    if (typeof m === 'string') return (s) => s.includes(m);
    return (s) => m.test(s);
}
