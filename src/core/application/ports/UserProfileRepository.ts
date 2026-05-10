import type { UserProfile, UserPreferences } from '../../domain/entities/UserProfile.ts';

export interface UserProfileRepository {
    get(userId: number): Promise<UserProfile | null>;
    upsert(userId: number, partial: Partial<UserPreferences>): Promise<UserProfile>;
    updateSummary(userId: number, summary: string): Promise<void>;
}
