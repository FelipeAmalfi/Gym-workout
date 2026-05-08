# Skill: cpf_user_flow

## Purpose
Modify CPF validation rules, user resolution by CPF, or `resolveUserNode` behavior.

## Scope
- `src/core/domain/value-objects/Cpf.ts` — validation algorithm
- `src/core/application/use-cases/user/ResolveUserByCpfUseCase.ts` — lookup/create logic
- `src/interface/graph/nodes/resolveUserNode.ts` — CPF extraction from slots, missing-slot handling

## Inputs
CPF validation rule changes, user lookup/create behavior changes, missing-slot message logic.

## Outputs
Updated `Cpf` class, use-case, and/or node.

## Constraints
`Cpf.parse()` throws `ValidationError` on invalid CPF. `Cpf.tryParse()` returns `null` on failure (no throw). Node adds `'cpf'` to `missingSlots` when absent, removes it when resolved. `actionError: 'invalid_cpf'` triggers the `ask_for_cpf_invalid` scenario in `messageGenerator.ts`. `getOrCreateByCpf` is defined on the `UserRepository` port — do not bypass it.

## Related Files
- `src/core/application/ports/UserRepository.ts` (`getOrCreateByCpf` signature)
- `src/infrastructure/database/repositories/PgUserRepository.ts` (port implementation)
