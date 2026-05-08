import type { UserRepository } from '../../ports/UserRepository.ts';
import { Cpf } from '../../../domain/value-objects/Cpf.ts';
import { ValidationError } from '../../../domain/errors/AppError.ts';
import type { User } from '../../../domain/entities/User.ts';

export class ResolveUserByCpfUseCase {
    private readonly userRepository: UserRepository;
    constructor(userRepository: UserRepository) { this.userRepository = userRepository; }

    async execute(rawCpf: string): Promise<User> {
        const cpf = Cpf.tryParse(rawCpf);
        if (!cpf) throw new ValidationError('invalid_cpf');
        return this.userRepository.getOrCreateByCpf(cpf);
    }
}
