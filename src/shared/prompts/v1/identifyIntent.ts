import { z } from 'zod/v3';

export const SlotsSchema = z.object({
    workoutId: z.number().optional().describe('Workout ID to act on (for update/delete/get)'),
    workoutName: z.string().optional().describe('Name for the workout'),
    goal: z.string().optional().describe('Fitness goal, e.g. muscle_gain, fat_loss, endurance, strength'),
    muscleGroups: z.array(z.string()).optional().describe('Target muscle groups, e.g. Chest, Biceps, Quadriceps'),
    equipment: z.array(z.string()).optional().describe('Available equipment, e.g. Barbell, Dumbbell, Body Only'),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Expert']).optional().describe('Workout difficulty level'),
    numExercises: z.number().optional().describe('Number of exercises to include in the workout'),
    userId: z.number().optional().describe('User ID if explicitly mentioned in the message'),
    cpf: z.string().optional().describe('Brazilian CPF when user provides one. Always return only the 11 digits, no dots or dashes.'),
    userName: z.string().optional().describe('Full name of the user when they provide it'),
    selectionRef: z.string().optional().describe('Reference to a previously listed workout: an ordinal ("first"/"second"), a position number ("1"), or a workout name'),
});

export const IntentSchema = z.object({
    intent: z.enum([
        'create_workout',
        'update_workout',
        'delete_workout',
        'get_workout',
        'list_workouts',
        'unknown',
    ]).describe('The identified user intent'),
    slots: SlotsSchema.optional().describe('All slot values extractable from the user message'),
});

export type IntentData = z.infer<typeof IntentSchema>;
export type Slots = z.infer<typeof SlotsSchema>;

export const getSystemPrompt = () => JSON.stringify({
    role: 'Workout Assistant Intent Classifier',
    task: 'Identify the user intent for workout management and extract all available slot values from the message',
    current_date: new Date().toISOString(),
    intents: {
        create_workout: {
            description: 'User wants to generate, create, or build a new workout plan',
            keywords: ['create', 'generate', 'make', 'build', 'new workout', 'I want a workout', 'give me a workout', 'suggest a workout'],
            required_slots: ['muscleGroups or goal (at least one)'],
            optional_slots: ['difficulty', 'equipment', 'numExercises', 'workoutName'],
        },
        update_workout: {
            description: 'User wants to modify or change an existing workout',
            keywords: ['update', 'change', 'modify', 'edit', 'rename'],
            required_slots: ['workoutId OR muscleGroups OR selectionRef'],
            optional_slots: ['workoutName', 'difficulty', 'goal'],
        },
        delete_workout: {
            description: 'User wants to delete or remove an existing workout',
            keywords: ['delete', 'remove', 'erase', 'get rid of'],
            required_slots: ['workoutId OR muscleGroups OR selectionRef'],
        },
        get_workout: {
            description: 'User wants to view or see details of one specific workout',
            keywords: ['show', 'get', 'view', 'see', 'details', 'display'],
            required_slots: ['workoutId OR muscleGroups OR selectionRef'],
        },
        list_workouts: {
            description: 'User wants to list, browse, or see all their workouts. May include a muscleGroups filter (e.g. "list my chest workouts").',
            keywords: ['list', 'all workouts', 'show all', 'my workouts', 'what workouts'],
            required_slots: [],
            optional_slots: ['muscleGroups'],
        },
        unknown: {
            description: 'User message is unrelated to workout management',
            examples: ['weather questions', 'cooking recipes', 'math problems'],
        },
    },
    valid_muscle_groups: [
        'Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves', 'Chest',
        'Forearms', 'Glutes', 'Hamstrings', 'Lats', 'Lower Back', 'Middle Back',
        'Neck', 'Quadriceps', 'Shoulders', 'Traps', 'Triceps',
    ],
    valid_equipment: [
        'Bands', 'Barbell', 'Body Only', 'Cable', 'Dumbbell', 'E-Z Curl Bar',
        'Exercise Ball', 'Foam Roll', 'Kettlebells', 'Machine', 'Medicine Ball', 'None', 'Other',
    ],
    valid_difficulty: ['Beginner', 'Intermediate', 'Expert'],
    extraction_rules: {
        muscleGroups: 'Match mentioned muscles to valid_muscle_groups list using fuzzy matching. "abs" → "Abdominals", "legs" → ["Quadriceps", "Hamstrings"]',
        equipment: 'Match mentioned equipment to valid_equipment. "weights" → "Dumbbell" or "Barbell", "no equipment" → "Body Only"',
        difficulty: 'Match level mentions: "easy/beginner" → "Beginner", "medium/moderate" → "Intermediate", "hard/advanced/expert" → "Expert"',
        workoutId: 'Extract numeric IDs explicitly mentioned as "workout #3", "workout ID 5", "the one with ID 2"',
        userId: 'Extract numeric user IDs only if explicitly stated. Do not infer.',
        cpf: 'Extract Brazilian CPF when the user provides one. Strip any dots, dashes, and spaces; return only the 11 digits in slots.cpf. Accept formats like "123.456.789-09", "12345678909", or "meu cpf é 123 456 789 09".',
        userName: 'Extract the user\'s full name when they provide it, e.g. "my name is João Silva" → "João Silva", "me chamo Ana" → "Ana".',
        name_continuity: 'When context.prior_intent is set and the user reply contains only their name, preserve context.prior_intent and extract the name into slots.userName.',
        selectionRef: 'When the user is choosing from a previously presented list (e.g. "the first one", "the second", "1", "Push Day"), extract the reference verbatim. Do NOT extract this if the user mentions a fresh muscle group instead.',
        intent_continuity: 'When the user replies with only a selection ("the second one", "Push Day", "1") and the previous assistant turn presented a list of workouts, preserve a workout-action intent. If context.prior_intent is one of update_workout/delete_workout/get_workout, keep that. If context.prior_intent is list_workouts and context.has_pending_workout_list is true, classify the new intent as get_workout. Do NOT classify pure selections as create_workout.',
        cpf_continuity: 'When context.prior_intent is set and the user reply contains only a CPF (digits, optionally with dots/dashes), preserve context.prior_intent and extract the CPF into slots.cpf. Do NOT classify a CPF-only message as unknown.',
    },
    examples: [
        {
            input: 'Create a chest and triceps workout for beginners with dumbbells',
            output: {
                intent: 'create_workout',
                slots: { muscleGroups: ['Chest', 'Triceps'], difficulty: 'Beginner', equipment: ['Dumbbell'] },
            },
        },
        {
            input: 'I want a leg workout, 8 exercises',
            output: {
                intent: 'create_workout',
                slots: { muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes'], numExercises: 8 },
            },
        },
        {
            input: 'List my chest workouts',
            output: {
                intent: 'list_workouts',
                slots: { muscleGroups: ['Chest'] },
            },
        },
        {
            input: 'Delete workout 3',
            output: { intent: 'delete_workout', slots: { workoutId: 3 } },
        },
        {
            input: 'Delete my chest workout',
            output: { intent: 'delete_workout', slots: { muscleGroups: ['Chest'] } },
        },
        {
            input: 'Show me my shoulder workout',
            output: { intent: 'get_workout', slots: { muscleGroups: ['Shoulders'] } },
        },
        {
            input: 'the second one',
            note: 'Follow-up after a list of workouts. If prior_intent was list_workouts, upgrade to get_workout.',
            output: { intent: 'get_workout', slots: { selectionRef: 'second' } },
        },
        {
            input: 'meu CPF é 123.456.789-09',
            note: 'Follow-up after assistant asked for CPF. Preserve prior_intent.',
            output: { intent: 'create_workout', slots: { cpf: '12345678909' } },
        },
        {
            input: '12345678909',
            note: 'Pure CPF reply. Preserve prior_intent.',
            output: { intent: 'create_workout', slots: { cpf: '12345678909' } },
        },
        {
            input: 'Show me all my workouts',
            output: { intent: 'list_workouts', slots: {} },
        },
        {
            input: 'What is the capital of France?',
            output: { intent: 'unknown', slots: {} },
        },
    ],
});

export const getUserPromptTemplate = (data: {
    message: string;
    priorIntent?: string;
    priorAssistantMessage?: string;
    hasPendingWorkoutList?: boolean;
}) => JSON.stringify({
    user_message: data.message,
    context: {
        prior_intent: data.priorIntent ?? null,
        prior_assistant_message: data.priorAssistantMessage ?? null,
        has_pending_workout_list: data.hasPendingWorkoutList ?? false,
    },
    instructions: [
        'Carefully analyze the user message to determine intent',
        'Use the context block to apply the intent_continuity and cpf_continuity rules',
        'Extract all slot values present in the message',
        'Match muscle groups and equipment to the valid lists using fuzzy matching',
        'Only extract workoutId if a numeric ID is clearly referenced',
        'For CPF: return only the 11 digits in slots.cpf, stripping any dots, dashes, or spaces',
        'Return slots only for values actually present — do not invent or assume missing values',
    ],
});
