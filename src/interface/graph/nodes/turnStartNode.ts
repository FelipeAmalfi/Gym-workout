import { getConversation, getTurn, getUserContext, getWorkflow, type GraphState } from '../state.ts';

export function createTurnStartNode() {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const userContext = getUserContext(state);
        const conversation = getConversation(state);
        const workflow = getWorkflow(state);
        // turn.* is wiped — drop stale action results before this turn runs
        void getTurn(state);

        return {
            userContext,
            conversation,
            workflow: {
                ...workflow,
                priorIntent: workflow.intent,
                missingSlots: [],
            },
            turn: {},
        };
    };
}
