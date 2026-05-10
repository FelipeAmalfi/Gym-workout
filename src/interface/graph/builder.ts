import { StateGraph, START, END, type MemorySaver } from '@langchain/langgraph';
import { WorkoutStateAnnotation } from './state.ts';
import {
    routeAfterIdentifyIntent,
    routeAfterResolveUser,
    routeAfterResolveWorkout,
} from './router.ts';
import type { GraphDependencies } from './dependencies.ts';
import { createTurnStartNode } from './nodes/turnStartNode.ts';
import { createLoadUserContextNode } from './nodes/loadUserContextNode.ts';
import { createIdentifyIntentNode } from './nodes/identifyIntentNode.ts';
import { createResolveUserNode } from './nodes/resolveUserNode.ts';
import { createResolveWorkoutNode } from './nodes/resolveWorkoutNode.ts';
import { createCreateWorkoutNode } from './nodes/createWorkoutNode.ts';
import { createUpdateWorkoutNode } from './nodes/updateWorkoutNode.ts';
import { createDeleteWorkoutNode } from './nodes/deleteWorkoutNode.ts';
import { createGetWorkoutNode } from './nodes/getWorkoutNode.ts';
import { createListWorkoutsNode } from './nodes/listWorkoutsNode.ts';
import { createSummarizeIfNeededNode } from './nodes/summarizeIfNeededNode.ts';
import { createMessageGeneratorNode } from './nodes/messageGeneratorNode.ts';

export function buildWorkoutGraph(deps: GraphDependencies, checkpointer: MemorySaver) {
    const workflow = new StateGraph({ stateSchema: WorkoutStateAnnotation })
        .addNode('turnStart', createTurnStartNode())
        .addNode('loadUserContext', createLoadUserContextNode(deps.loadUserProfile))
        .addNode('identifyIntent', createIdentifyIntentNode(deps.classifyIntent))
        .addNode('resolveUser', createResolveUserNode(deps.resolveUserByCpf, deps.loadUserProfile))
        .addNode('resolveWorkout', createResolveWorkoutNode(deps.resolveWorkoutReference))
        .addNode('createWorkout', createCreateWorkoutNode(deps.createWorkout, deps.updateUserProfile))
        .addNode('updateWorkout', createUpdateWorkoutNode(deps.updateWorkout))
        .addNode('deleteWorkout', createDeleteWorkoutNode(deps.deleteWorkout))
        .addNode('getWorkout', createGetWorkoutNode(deps.getWorkout))
        .addNode('listWorkouts', createListWorkoutsNode(deps.listWorkouts))
        .addNode('summarizeIfNeeded', createSummarizeIfNeededNode(deps.summarizeConversation, deps.updateUserProfile))
        .addNode('message', createMessageGeneratorNode(deps.generateMessage))

        .addEdge(START, 'turnStart')
        .addEdge('turnStart', 'loadUserContext')
        .addEdge('loadUserContext', 'identifyIntent')

        .addConditionalEdges('identifyIntent', routeAfterIdentifyIntent, {
            resolveUser: 'resolveUser',
            message: 'message',
        })

        .addConditionalEdges('resolveUser', routeAfterResolveUser, {
            create_workout: 'createWorkout',
            resolveWorkout: 'resolveWorkout',
            list_workouts: 'listWorkouts',
            message: 'message',
        })

        .addConditionalEdges('resolveWorkout', routeAfterResolveWorkout, {
            updateWorkout: 'updateWorkout',
            deleteWorkout: 'deleteWorkout',
            getWorkout: 'getWorkout',
            message: 'message',
        })

        .addEdge('createWorkout', 'summarizeIfNeeded')
        .addEdge('updateWorkout', 'summarizeIfNeeded')
        .addEdge('deleteWorkout', 'summarizeIfNeeded')
        .addEdge('getWorkout', 'summarizeIfNeeded')
        .addEdge('listWorkouts', 'summarizeIfNeeded')
        .addEdge('summarizeIfNeeded', 'message')
        .addEdge('message', END);

    return workflow.compile({ checkpointer });
}
