import type { UserProfileRepository } from '../../ports/UserProfileRepository.ts';
import type { UserProfile } from '../../../domain/entities/UserProfile.ts';

export class LoadUserProfileUseCase {
    private readonly repo: UserProfileRepository;
    constructor(repo: UserProfileRepository) { this.repo = repo; }

    async execute(userId: number): Promise<UserProfile | null> {
        return this.repo.get(userId);
    }
}
