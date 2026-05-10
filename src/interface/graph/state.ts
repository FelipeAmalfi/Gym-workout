import { MessagesZodMeta } from '@langchain/langgraph';
import { withLangGraph } from '@langchain/langgraph/zod';
import type { BaseMessage } from '@langchain/core/messages';
import { z } from 'zod/v3';

const RetrievedExerciseSchema = z.object({
    exerciseId: z.number(),
    title: z.string(),
    description: z.string(),
    bodyPart: z.string(),
    equipment: z.string(),
    level: z.string(),
    score: z.number(),
});

const WorkoutCandidateSchema = z.object({
    id: z.number(),
    name: z.string(),
    goal: z.string().nullable().optional(),
    difficulty: z.string().nullable().optional(),
    muscleGroups: z.array(z.string()),
});

const DifficultyEnum = z.enum(['Beginner', 'Intermediate', 'Expert']);

const SlotsZ = z.object({
    workoutId: z.number().optional(),
    workoutName: z.string().optional(),
    goal: z.string().optional(),
    muscleGroups: z.array(z.string()).optional(),
    equipment: z.array(z.string()).optional(),
    difficulty: DifficultyEnum.optional(),
    difficultyByMuscle: z.record(DifficultyEnum).optional(),
    numExercises: z.number().optional(),
    selectionRef: z.string().optional(),
    // Transient identity-extraction slots; consumed by resolveUserNode and moved into userContext.
    cpf: z.string().optional(),
    userName: z.string().optional(),
    userId: z.number().optional(),
});

const GoalMentionZ = z.object({
    fact: z.string(),
    capturedAt: z.string(),
});

const UserPreferencesZ = z.object({
    preferredMuscles: z.array(z.string()).optional(),
    preferredDifficulty: DifficultyEnum.optional(),
    preferredEquipment: z.array(z.string()).optional(),
    defaultNumExercises: z.number().optional(),
    goalsMentioned: z.array(GoalMentionZ).optional(),
    lastSummary: z.string().optional(),
});

const UserContextZ = z.object({
    userId: z.number().optional(),
    userName: z.string().optional(),
    cpf: z.string().optional(),
    isIdentified: z.boolean(),
    profileLoadedAt: z.number().optional(),
    preferences: UserPreferencesZ.optional(),
});

const ConversationZ = z.object({
    summary: z.string().optional(),
    summarizedTurns: z.number(),
});

const IntentEnum = z.enum([
    'create_workout',
    'update_workout',
    'delete_workout',
    'get_workout',
    'list_workouts',
    'unknown',
]);

const WorkflowZ = z.object({
    intent: IntentEnum.optional(),
    priorIntent: IntentEnum.optional(),
    slots: SlotsZ,
    missingSlots: z.array(z.string()),
    workoutCandidates: z.array(WorkoutCandidateSchema).optional(),
});

const TurnZ = z.object({
    retrievedExercises: z.array(RetrievedExerciseSchema).optional(),
    actionSuccess: z.boolean().optional(),
    actionError: z.string().optional(),
    actionData: z.any().optional(),
    error: z.string().optional(),
});

export const WorkoutStateAnnotation = z.object({
    messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
    userContext: UserContextZ.optional(),
    conversation: ConversationZ.optional(),
    workflow: WorkflowZ.optional(),
    turn: TurnZ.optional(),
});

export type GraphState = z.infer<typeof WorkoutStateAnnotation>;
export type Slots = z.infer<typeof SlotsZ>;
export type UserContext = z.infer<typeof UserContextZ>;
export type Conversation = z.infer<typeof ConversationZ>;
export type Workflow = z.infer<typeof WorkflowZ>;
export type Turn = z.infer<typeof TurnZ>;
export type Intent = z.infer<typeof IntentEnum>;

export const EMPTY_USER_CONTEXT: UserContext = { isIdentified: false };
export const EMPTY_CONVERSATION: Conversation = { summarizedTurns: 0 };
export const EMPTY_WORKFLOW: Workflow = { slots: {}, missingSlots: [] };
export const EMPTY_TURN: Turn = {};

export function getUserContext(state: GraphState): UserContext {
    return state.userContext ?? EMPTY_USER_CONTEXT;
}
export function getConversation(state: GraphState): Conversation {
    return state.conversation ?? EMPTY_CONVERSATION;
}
export function getWorkflow(state: GraphState): Workflow {
    return state.workflow ?? EMPTY_WORKFLOW;
}
export function getTurn(state: GraphState): Turn {
    return state.turn ?? EMPTY_TURN;
}
