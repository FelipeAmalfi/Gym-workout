import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { PgUserRepository } from '../../../src/infrastructure/database/repositories/PgUserRepository.ts';
import { ResolveUserByCpfUseCase } from '../../../src/core/application/use-cases/user/ResolveUserByCpfUseCase.ts';
import { ValidationError } from '../../../src/core/domain/errors/AppError.ts';

describe('ResolveUserByCpfUseCase', () => {
    let useCase: ResolveUserByCpfUseCase;

    beforeAll(() => {
        useCase = new ResolveUserByCpfUseCase(new PgUserRepository(getPostgres().pool));
    });

    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
    });

    it('creates a user for a fresh CPF', async () => {
        const user = await useCase.execute('111.444.777-35', 'Alice');
        expect(user.id).toBeGreaterThan(0);
        expect(user.cpf).toBe('11144477735');
    });

    it('returns the same user on repeated calls', async () => {
        const a = await useCase.execute('11144477735', 'Alice');
        const b = await useCase.execute('11144477735', 'Other Name');
        expect(b.id).toBe(a.id);
    });

    it('rejects invalid CPF with ValidationError', async () => {
        await expect(useCase.execute('123', 'Alice')).rejects.toThrow(ValidationError);
        await expect(useCase.execute('00000000000', 'Alice')).rejects.toThrow(ValidationError);
    });
});
