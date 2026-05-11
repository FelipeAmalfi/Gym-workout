import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { getPostgres, truncateAll } from '../../setup/postgres.ts';
import { PgUserRepository } from '../../../src/infrastructure/database/repositories/PgUserRepository.ts';
import { Cpf } from '../../../src/core/domain/value-objects/Cpf.ts';

describe('PgUserRepository', () => {
    let repo: PgUserRepository;

    beforeAll(() => {
        repo = new PgUserRepository(getPostgres().pool);
    });

    beforeEach(async () => {
        await truncateAll(getPostgres().pool);
    });

    it('creates a new user when CPF is unknown', async () => {
        const cpf = Cpf.parse('11144477735');
        const user = await repo.getOrCreateByCpf(cpf, 'Alice');
        expect(user.cpf).toBe('11144477735');
        expect(user.name).toBe('Alice');
        expect(user.id).toBeGreaterThan(0);
    });

    it('returns the existing user when CPF is known', async () => {
        const cpf = Cpf.parse('11144477735');
        const first = await repo.getOrCreateByCpf(cpf, 'Alice');
        const second = await repo.getOrCreateByCpf(cpf, 'Different Name');
        expect(second.id).toBe(first.id);
        expect(second.name).toBe('Alice'); // existing record wins
    });

    it('enforces CPF uniqueness across different names', async () => {
        const cpf = Cpf.parse('52998224725');
        const a = await repo.getOrCreateByCpf(cpf, 'Bob');
        const b = await repo.getOrCreateByCpf(cpf, 'Bob');
        expect(a.id).toBe(b.id);
    });
});
