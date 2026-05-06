import { StateGraph, START, END, MessagesZodMeta, MemorySaver } from '@langchain/langgraph';
import { withLangGraph } from '@langchain/langgraph/zod';
import type { BaseMessage } from '@langchain/core/messages';
import { z } from 'zod/v3';

import { createIdentifyIntentNode } from './nodes/identifyIntentNode.ts';
import { createCreateWorkoutNode } from './nodes/createWorkoutNode.ts';
import { createUpdateWorkoutNode } from './nodes/updateWorkoutNode.ts';
import { createDeleteWorkoutNode } from './nodes/deleteWorkoutNode.ts';
import { createGetWorkoutNode } from './nodes/getWorkoutNode.ts';
import { createListWorkoutsNode } from './nodes/listWorkoutsNode.ts';
import { createResolveWorkoutNode } from './nodes/resolveWorkoutNode.ts';
import { createMessageGeneratorNode } from './nodes/messageGeneratorNode.ts';

import type { OpenRouterService } from '../services/openRouterService.ts';
import type { WorkoutService } from '../services/workoutService.ts';
import type { RagService } from '../services/ragService.ts';

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

    intent: z.enum([
        'create_workout',
        'update_workout',
        'delete_workout',
        'get_workout',
        'list_workouts',
        'unknown',
    ]).optional(),

    slots: z.object({
        workoutId: z.number().optional(),
        workoutName: z.string().optional(),
        goal: z.string().optional(),
        muscleGroups: z.array(z.string()).optional(),
        equipment: z.array(z.string()).optional(),
        difficulty: z.enum(['Beginner', 'Intermediate', 'Expert']).optional(),
        numExercises: z.number().optional(),
        userId: z.number().optional(),
        selectionRef: z.string().optional(),
    }).optional(),

    missingSlots: z.array(z.string()).optional(),

    retrievedExercises: z.array(RetrievedExerciseSchema).optional(),

    workoutCandidates: z.array(WorkoutCandidateSchema).optional(),

    actionSuccess: z.boolean().optional(),
    actionError: z.string().optional(),
    actionData: z.any().optional(),

    error: z.string().optional(),
});

export type GraphState = z.infer<typeof WorkoutStateAnnotation>;

export function buildWorkoutGraph(
    llmClient: OpenRouterService,
    workoutService: WorkoutService,
    ragService: RagService,
    checkpointer: MemorySaver,
) {
    const INTENTS_NEEDING_RESOLVE = new Set(['update_workout', 'delete_workout', 'get_workout']);

    const workflow = new StateGraph({ stateSchema: WorkoutStateAnnotation })
        .addNode('identifyIntent', createIdentifyIntentNode(llmClient))
        .addNode('resolveWorkout', createResolveWorkoutNode(workoutService))
        .addNode('createWorkout', createCreateWorkoutNode(workoutService, ragService))
        .addNode('updateWorkout', createUpdateWorkoutNode(workoutService))
        .addNode('deleteWorkout', createDeleteWorkoutNode(workoutService))
        .addNode('getWorkout', createGetWorkoutNode(workoutService))
        .addNode('listWorkouts', createListWorkoutsNode(workoutService))
        .addNode('message', createMessageGeneratorNode(llmClient))

        .addEdge(START, 'identifyIntent')

        .addConditionalEdges(
            'identifyIntent',
            (state: GraphState): string => {
                if (state.error || !state.intent || state.intent === 'unknown') return 'message';
                if (state.missingSlots && state.missingSlots.length > 0) return 'message';
                if (INTENTS_NEEDING_RESOLVE.has(state.intent)) {
                    console.log(`➡️  Routing to: resolveWorkout (intent=${state.intent})`);
                    return 'resolveWorkout';
                }
                console.log(`➡️  Routing to: ${state.intent}`);
                return state.intent;
            },
            {
                create_workout: 'createWorkout',
                resolveWorkout: 'resolveWorkout',
                list_workouts: 'listWorkouts',
                message: 'message',
            },
        )

        .addConditionalEdges(
            'resolveWorkout',
            (state: GraphState): string => {
                if (state.missingSlots && state.missingSlots.length > 0) return 'message';
                if (state.actionError || state.actionSuccess) return 'message';
                if (state.intent === 'update_workout') return 'updateWorkout';
                if (state.intent === 'delete_workout') return 'deleteWorkout';
                if (state.intent === 'get_workout') return 'getWorkout';
                return 'message';
            },
            {
                updateWorkout: 'updateWorkout',
                deleteWorkout: 'deleteWorkout',
                getWorkout: 'getWorkout',
                message: 'message',
            },
        )

        .addEdge('createWorkout', 'message')
        .addEdge('updateWorkout', 'message')
        .addEdge('deleteWorkout', 'message')
        .addEdge('getWorkout', 'message')
        .addEdge('listWorkouts', 'message')
        .addEdge('message', END);

    return workflow.compile({ checkpointer });
}
