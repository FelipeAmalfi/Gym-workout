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
    }).optional(),

    missingSlots: z.array(z.string()).optional(),

    retrievedExercises: z.array(RetrievedExerciseSchema).optional(),

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
    const workflow = new StateGraph({ stateSchema: WorkoutStateAnnotation })
        .addNode('identifyIntent', createIdentifyIntentNode(llmClient))
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
                console.log(`➡️  Routing to: ${state.intent}`);
                return state.intent;
            },
            {
                create_workout: 'createWorkout',
                update_workout: 'updateWorkout',
                delete_workout: 'deleteWorkout',
                get_workout: 'getWorkout',
                list_workouts: 'listWorkouts',
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
