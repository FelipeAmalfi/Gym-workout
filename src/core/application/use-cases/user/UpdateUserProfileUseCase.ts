import type { UserProfileRepository } from '../../ports/UserProfileRepository.ts';
import type { UserProfile, UserPreferences } from '../../../domain/entities/UserProfile.ts';

export class UpdateUserProfileUseCase {
    private readonly repo: UserProfileRepository;
    constructor(repo: UserProfileRepository) { this.repo = repo; }

    async execute(userId: number, partial: Partial<UserPreferences>): Promise<UserProfile> {
        return this.repo.upsert(userId, partial);
    }

    async saveSummary(userId: number, summary: string): Promise<void> {
        await this.repo.updateSummary(userId, summary);
    }
}
