import type { ResolveUserByCpfUseCase } from '../../../core/application/use-cases/user/ResolveUserByCpfUseCase.ts';
import { ValidationError } from '../../../core/domain/errors/AppError.ts';
import type { GraphState } from '../state.ts';

function withMissingSlot(existing: string[] | undefined, slot: string): string[] {
    const set = new Set(existing ?? []);
    set.add(slot);
    return Array.from(set);
}

function withoutMissingSlot(existing: string[] | undefined, slot: string): string[] {
    return (existing ?? []).filter((s) => s !== slot);
}

export function createResolveUserNode(resolveUserByCpf: ResolveUserByCpfUseCase) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        const slots = state.slots ?? {};

        if (slots.userId != null) {
            return { missingSlots: withoutMissingSlot(state.missingSlots, 'cpf') };
        }

        if (slots.cpf) {
            try {
                const user = await resolveUserByCpf.execute(slots.cpf);
                return {
                    slots: { ...slots, userId: user.id, cpf: user.cpf },
                    missingSlots: withoutMissingSlot(state.missingSlots, 'cpf'),
                    actionError: undefined,
                };
            } catch (error) {
                if (error instanceof ValidationError) {
                    return {
                        slots: { ...slots, cpf: undefined },
                        missingSlots: withMissingSlot(state.missingSlots, 'cpf'),
                        actionError: 'invalid_cpf',
                    };
                }
                return {
                    actionError: error instanceof Error ? error.message : 'User resolution failed',
                    missingSlots: withMissingSlot(state.missingSlots, 'cpf'),
                };
            }
        }

        return { missingSlots: withMissingSlot(state.missingSlots, 'cpf') };
    };
}
