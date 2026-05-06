import { MemorySaver } from '@langchain/langgraph';
import { config } from '../config.ts';
import { pool } from '../db/client.ts';
import { OpenRouterService } from '../services/openRouterService.ts';
import { WorkoutService } from '../services/workoutService.ts';
import { RagService } from '../services/ragService.ts';
import { buildWorkoutGraph } from './graph.ts';

const memorySaver = new MemorySaver();

export function buildGraph() {
    const llmClient = new OpenRouterService(config);
    const workoutService = new WorkoutService(pool);
    const ragService = new RagService(pool, config.apiKey);
    return buildWorkoutGraph(llmClient, workoutService, ragService, memorySaver);
}

export const graph = async () => buildGraph();
