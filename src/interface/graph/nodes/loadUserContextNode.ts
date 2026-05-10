import type { LoadUserProfileUseCase } from '../../../core/application/use-cases/user/LoadUserProfileUseCase.ts';
import { getUserContext, type GraphState, type UserContext } from '../state.ts';

const PROFILE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function createLoadUserContextNode(loadUserProfile: LoadUserProfileUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const userContext = getUserContext(state);

        if (
            userContext.isIdentified &&
            userContext.userId != null &&
            userContext.preferences &&
            userContext.profileLoadedAt &&
            Date.now() - userContext.profileLoadedAt < PROFILE_TTL_MS
        ) {
            return {};
        }

        if (userContext.userId == null) return {};

        try {
            const profile = await loadUserProfile.execute(userContext.userId);
            const next: UserContext = {
                ...userContext,
                isIdentified: true,
                profileLoadedAt: Date.now(),
                preferences: profile
                    ? {
                          preferredMuscles: profile.preferredMuscles,
                          preferredDifficulty: profile.preferredDifficulty,
                          preferredEquipment: profile.preferredEquipment,
                          defaultNumExercises: profile.defaultNumExercises,
                          goalsMentioned: profile.goalsMentioned,
                          lastSummary: profile.lastSummary,
                      }
                    : undefined,
            };
            return { userContext: next };
        } catch {
            return {};
        }
    };
}
