import type pg from 'pg';
import type { User } from '../../../core/domain/entities/User.ts';
import type { Cpf } from '../../../core/domain/value-objects/Cpf.ts';
import type { UserRepository } from '../../../core/application/ports/UserRepository.ts';
import { RepositoryError } from '../../../core/domain/errors/AppError.ts';

interface UserRow {
    id: number;
    cpf: string;
}

export class PgUserRepository implements UserRepository {
    private readonly pool: pg.Pool;
    constructor(pool: pg.Pool) { this.pool = pool; }

    async getOrCreateByCpf(cpf: Cpf): Promise<User> {
        try {
            const digits = cpf.digits;

            const existing = await this.pool.query<UserRow>(
                `SELECT id, cpf FROM users WHERE cpf = $1`,
                [digits],
            );
            if (existing.rows[0]) return { id: existing.rows[0].id, cpf: existing.rows[0].cpf };

            const created = await this.pool.query<UserRow>(
                `INSERT INTO users (name, email, cpf)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (email) DO UPDATE SET cpf = EXCLUDED.cpf
                 RETURNING id, cpf`,
                [`User ${digits}`, `user-${digits}@gymworkout.ai`, digits],
            );
            const row = created.rows[0]!;
            return { id: row.id, cpf: row.cpf };
        } catch (error) {
            throw new RepositoryError('Failed to resolve user by CPF', error);
        }
    }
}
