import type { User } from '../../domain/entities/User.ts';
import type { Cpf } from '../../domain/value-objects/Cpf.ts';

export interface UserRepository {
    getOrCreateByCpf(cpf: Cpf): Promise<User>;
}
