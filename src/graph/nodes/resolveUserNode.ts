import { WorkoutService } from '../../services/workoutService.ts';
import type { GraphState } from '../graph.ts';

function isValidCpf(raw: string): { ok: boolean; digits: string } {
    const digits = (raw ?? '').replace(/\D/g, '');
    if (digits.length !== 11) return { ok: false, digits };
    if (/^(\d)\1{10}$/.test(digits)) return { ok: false, digits };

    const calcCheckDigit = (slice: string, startWeight: number): number => {
        let sum = 0;
        let weight = startWeight;
        for (const ch of slice) {
            sum += Number.parseInt(ch, 10) * weight;
            weight--;
        }
        const remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };

    const d1 = calcCheckDigit(digits.slice(0, 9), 10);
    const d2 = calcCheckDigit(digits.slice(0, 10), 11);
    const ok =
        d1 === Number.parseInt(digits[9]!, 10) &&
        d2 === Number.parseInt(digits[10]!, 10);
    return { ok, digits };
}

function withMissingSlot(existing: string[] | undefined, slot: string): string[] {
    const set = new Set(existing ?? []);
    set.add(slot);
    return Array.from(set);
}

function withoutMissingSlot(existing: string[] | undefined, slot: string): string[] {
    return (existing ?? []).filter(s => s !== slot);
}

export function createResolveUserNode(workoutService: WorkoutService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log('👤 Resolving user identity...');
        const slots = state.slots ?? {};

        if (slots.userId != null) {
            console.log(`✅ userId already present: ${slots.userId}`);
            return {
                missingSlots: withoutMissingSlot(state.missingSlots, 'cpf'),
            };
        }

        if (slots.cpf) {
            const { ok, digits } = isValidCpf(slots.cpf);
            if (!ok) {
                console.log(`⚠️  Invalid CPF: ${slots.cpf}`);
                return {
                    slots: { ...slots, cpf: undefined },
                    missingSlots: withMissingSlot(state.missingSlots, 'cpf'),
                    actionError: 'invalid_cpf',
                };
            }
            try {
                const user = await workoutService.getOrCreateUserByCpf(digits);
                console.log(`✅ User resolved: cpf=${digits} → userId=${user.id}`);
                return {
                    slots: { ...slots, userId: user.id, cpf: digits },
                    missingSlots: withoutMissingSlot(state.missingSlots, 'cpf'),
                    actionError: undefined,
                };
            } catch (error) {
                console.error('❌ Error in resolveUserNode:', error);
                return {
                    actionError: error instanceof Error ? error.message : 'User resolution failed',
                    missingSlots: withMissingSlot(state.missingSlots, 'cpf'),
                };
            }
        }

        console.log('⚠️  No userId or cpf available — asking user for CPF');
        return {
            missingSlots: withMissingSlot(state.missingSlots, 'cpf'),
        };
    };
}
