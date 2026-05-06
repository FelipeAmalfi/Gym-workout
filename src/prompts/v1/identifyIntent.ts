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
            description: 'User wants to list, browse, or see all their workouts',
            keywords: ['list', 'all workouts', 'show all', 'my workouts', 'what workouts'],
            required_slots: [],
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
        selectionRef: 'When the user is choosing from a previously presented list (e.g. "the first one", "the second", "1", "Push Day"), extract the reference verbatim. Do NOT extract this if the user mentions a fresh muscle group instead.',
        intent_continuity: 'When the user replies with only a selection ("the second one", "Push Day", "1") and the previous assistant turn presented a list of workouts, preserve the prior intent (update_workout / delete_workout / get_workout). Do NOT classify pure selections as create_workout or list_workouts.',
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
            note: 'Follow-up after the assistant presented a list. Preserve the prior intent.',
            output: { intent: 'delete_workout', slots: { selectionRef: 'second' } },
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

export const getUserPromptTemplate = (message: string) => JSON.stringify({
    user_message: message,
    instructions: [
        'Carefully analyze the user message to determine intent',
        'Extract all slot values present in the message',
        'Match muscle groups and equipment to the valid lists using fuzzy matching',
        'Only extract workoutId if a numeric ID is clearly referenced',
        'Return slots only for values actually present — do not invent or assume missing values',
    ],
});
