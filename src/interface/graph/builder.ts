import { StateGraph, START, END, type MemorySaver } from '@langchain/langgraph';
import { WorkoutStateAnnotation } from './state.ts';
import {
    routeAfterIdentifyIntent,
    routeAfterResolveUser,
    routeAfterResolveWorkout,
} from './router.ts';
import type { GraphDependencies } from './dependencies.ts';
import { createIdentifyIntentNode } from './nodes/identifyIntentNode.ts';
import { createResolveUserNode } from './nodes/resolveUserNode.ts';
import { createResolveWorkoutNode } from './nodes/resolveWorkoutNode.ts';
import { createCreateWorkoutNode } from './nodes/createWorkoutNode.ts';
import { createUpdateWorkoutNode } from './nodes/updateWorkoutNode.ts';
import { createDeleteWorkoutNode } from './nodes/deleteWorkoutNode.ts';
import { createGetWorkoutNode } from './nodes/getWorkoutNode.ts';
import { createListWorkoutsNode } from './nodes/listWorkoutsNode.ts';
import { createMessageGeneratorNode } from './nodes/messageGeneratorNode.ts';

export function buildWorkoutGraph(deps: GraphDependencies, checkpointer: MemorySaver) {
    const workflow = new StateGraph({ stateSchema: WorkoutStateAnnotation })
        .addNode('identifyIntent', createIdentifyIntentNode(deps.classifyIntent))
        .addNode('resolveUser', createResolveUserNode(deps.resolveUserByCpf))
        .addNode('resolveWorkout', createResolveWorkoutNode(deps.resolveWorkoutReference))
        .addNode('createWorkout', createCreateWorkoutNode(deps.createWorkout))
        .addNode('updateWorkout', createUpdateWorkoutNode(deps.updateWorkout))
        .addNode('deleteWorkout', createDeleteWorkoutNode(deps.deleteWorkout))
        .addNode('getWorkout', createGetWorkoutNode(deps.getWorkout))
        .addNode('listWorkouts', createListWorkoutsNode(deps.listWorkouts))
        .addNode('message', createMessageGeneratorNode(deps.generateMessage))

        .addEdge(START, 'identifyIntent')

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

        .addEdge('createWorkout', 'message')
        .addEdge('updateWorkout', 'message')
        .addEdge('deleteWorkout', 'message')
        .addEdge('getWorkout', 'message')
        .addEdge('listWorkouts', 'message')
        .addEdge('message', END);

    return workflow.compile({ checkpointer });
}
