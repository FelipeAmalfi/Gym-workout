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

export const WorkoutStateAnnotation = z.object({
    messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),

    intent: z
        .enum([
            'create_workout',
            'update_workout',
            'delete_workout',
            'get_workout',
            'list_workouts',
            'unknown',
        ])
        .optional(),

    slots: z
        .object({
            workoutId: z.number().optional(),
            workoutName: z.string().optional(),
            goal: z.string().optional(),
            muscleGroups: z.array(z.string()).optional(),
            equipment: z.array(z.string()).optional(),
            difficulty: z.enum(['Beginner', 'Intermediate', 'Expert']).optional(),
            numExercises: z.number().optional(),
            userId: z.number().optional(),
            cpf: z.string().optional(),
            selectionRef: z.string().optional(),
        })
        .optional(),

    missingSlots: z.array(z.string()).optional(),

    retrievedExercises: z.array(RetrievedExerciseSchema).optional(),

    workoutCandidates: z.array(WorkoutCandidateSchema).optional(),

    actionSuccess: z.boolean().optional(),
    actionError: z.string().optional(),
    actionData: z.any().optional(),

    error: z.string().optional(),
});

export type GraphState = z.infer<typeof WorkoutStateAnnotation>;
