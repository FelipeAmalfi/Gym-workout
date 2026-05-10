import type { ResolveUserByCpfUseCase } from '../../../core/application/use-cases/user/ResolveUserByCpfUseCase.ts';
import type { LoadUserProfileUseCase } from '../../../core/application/use-cases/user/LoadUserProfileUseCase.ts';
import { ValidationError } from '../../../core/domain/errors/AppError.ts';
import { Cpf } from '../../../core/domain/value-objects/Cpf.ts';
import { getUserContext, getWorkflow, type GraphState, type UserContext } from '../state.ts';
import { withMissingSlot, withoutMissingSlots } from '../helpers.ts';

export function createResolveUserNode(
    resolveUserByCpf: ResolveUserByCpfUseCase,
    loadUserProfile: LoadUserProfileUseCase,
) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const workflow = getWorkflow(state);
        const userContext = getUserContext(state);

        if (userContext.isIdentified && userContext.userId != null) {
            const cleared = withoutMissingSlots(workflow.missingSlots, ['cpf', 'name']);
            if (cleared.length === workflow.missingSlots.length) return {};
            return { workflow: { ...workflow, missingSlots: cleared } };
        }

        const slots = workflow.slots;

        // Fast path: a userId came in via the request body or earlier extraction.
        if (slots.userId != null) {
            try {
                const profile = await loadUserProfile.execute(slots.userId);
                const next: UserContext = {
                    userId: slots.userId,
                    userName: slots.userName ?? userContext.userName,
                    cpf: slots.cpf ?? userContext.cpf,
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
                return {
                    userContext: next,
                    workflow: {
                        ...workflow,
                        slots: { ...slots, userId: slots.userId },
                        missingSlots: withoutMissingSlots(workflow.missingSlots, ['cpf', 'name']),
                    },
                };
            } catch {
                // fall through to full CPF resolution
            }
        }

        if (slots.cpf && !Cpf.isValid(slots.cpf)) {
            return {
                workflow: {
                    ...workflow,
                    slots: { ...slots, cpf: undefined },
                    missingSlots: withMissingSlot(workflow.missingSlots, 'cpf'),
                },
                turn: { actionError: 'invalid_cpf' },
            };
        }

        const missingCpf = !slots.cpf;
        const missingName = !slots.userName;

        if (missingCpf || missingName) {
            let updated = workflow.missingSlots;
            updated = missingCpf ? withMissingSlot(updated, 'cpf') : withoutMissingSlots(updated, ['cpf']);
            updated = missingName ? withMissingSlot(updated, 'name') : withoutMissingSlots(updated, ['name']);
            return { workflow: { ...workflow, missingSlots: updated } };
        }

        try {
            const user = await resolveUserByCpf.execute(slots.cpf!, slots.userName!);
            let profile = null;
            try {
                profile = await loadUserProfile.execute(user.id);
            } catch (profileError) {
                console.error('loadUserProfile failed, continuing without profile:', profileError);
            }
            const next: UserContext = {
                userId: user.id,
                userName: user.name,
                cpf: user.cpf,
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
            return {
                userContext: next,
                workflow: {
                    ...workflow,
                    slots: { ...slots, userId: user.id, cpf: user.cpf },
                    missingSlots: withoutMissingSlots(workflow.missingSlots, ['cpf', 'name']),
                },
                turn: {},
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                return {
                    workflow: {
                        ...workflow,
                        slots: { ...slots, cpf: undefined },
                        missingSlots: withMissingSlot(workflow.missingSlots, 'cpf'),
                    },
                    turn: { actionError: 'invalid_cpf' },
                };
            }
            return {
                workflow: { ...workflow, missingSlots: withMissingSlot(workflow.missingSlots, 'cpf') },
                turn: {
                    actionError: error instanceof Error ? error.message : 'User resolution failed',
                },
            };
        }
    };
}
