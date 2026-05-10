import type pg from 'pg';
import type { UserProfileRepository } from '../../../core/application/ports/UserProfileRepository.ts';
import type { UserProfile, UserPreferences, GoalMention } from '../../../core/domain/entities/UserProfile.ts';
import type { Difficulty } from '../../../core/domain/value-objects/Difficulty.ts';
import { RepositoryError } from '../../../core/domain/errors/AppError.ts';

interface ProfileRow {
    user_id: number;
    preferred_muscles: string[] | null;
    preferred_difficulty: string | null;
    preferred_equipment: string[] | null;
    default_num_exercises: number | null;
    goals_mentioned: GoalMention[] | null;
    last_summary: string | null;
    last_summary_at: Date | null;
}

function rowToProfile(row: ProfileRow): UserProfile {
    return {
        userId: row.user_id,
        preferredMuscles: row.preferred_muscles ?? undefined,
        preferredDifficulty: (row.preferred_difficulty as Difficulty | null) ?? undefined,
        preferredEquipment: row.preferred_equipment ?? undefined,
        defaultNumExercises: row.default_num_exercises ?? undefined,
        goalsMentioned: row.goals_mentioned ?? undefined,
        lastSummary: row.last_summary ?? undefined,
        lastSummaryAt: row.last_summary_at?.toISOString() ?? undefined,
    };
}

export class PgUserProfileRepository implements UserProfileRepository {
    private readonly pool: pg.Pool;
    constructor(pool: pg.Pool) { this.pool = pool; }

    async get(userId: number): Promise<UserProfile | null> {
        try {
            const result = await this.pool.query<ProfileRow>(
                `SELECT user_id, preferred_muscles, preferred_difficulty, preferred_equipment,
                        default_num_exercises, goals_mentioned, last_summary, last_summary_at
                 FROM user_profile WHERE user_id = $1`,
                [userId],
            );
            const row = result.rows[0];
            return row ? rowToProfile(row) : null;
        } catch (error) {
            throw new RepositoryError('Failed to load user profile', error);
        }
    }

    async upsert(userId: number, partial: Partial<UserPreferences>): Promise<UserProfile> {
        try {
            const result = await this.pool.query<ProfileRow>(
                `INSERT INTO user_profile (
                    user_id, preferred_muscles, preferred_difficulty, preferred_equipment,
                    default_num_exercises, goals_mentioned, updated_at
                 ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 ON CONFLICT (user_id) DO UPDATE SET
                    preferred_muscles     = COALESCE(EXCLUDED.preferred_muscles, user_profile.preferred_muscles),
                    preferred_difficulty  = COALESCE(EXCLUDED.preferred_difficulty, user_profile.preferred_difficulty),
                    preferred_equipment   = COALESCE(EXCLUDED.preferred_equipment, user_profile.preferred_equipment),
                    default_num_exercises = COALESCE(EXCLUDED.default_num_exercises, user_profile.default_num_exercises),
                    goals_mentioned       = COALESCE(EXCLUDED.goals_mentioned, user_profile.goals_mentioned),
                    updated_at            = NOW()
                 RETURNING user_id, preferred_muscles, preferred_difficulty, preferred_equipment,
                           default_num_exercises, goals_mentioned, last_summary, last_summary_at`,
                [
                    userId,
                    partial.preferredMuscles ?? null,
                    partial.preferredDifficulty ?? null,
                    partial.preferredEquipment ?? null,
                    partial.defaultNumExercises ?? null,
                    partial.goalsMentioned ? JSON.stringify(partial.goalsMentioned) : null,
                ],
            );
            return rowToProfile(result.rows[0]!);
        } catch (error) {
            throw new RepositoryError('Failed to upsert user profile', error);
        }
    }

    async updateSummary(userId: number, summary: string): Promise<void> {
        try {
            await this.pool.query(
                `INSERT INTO user_profile (user_id, last_summary, last_summary_at, updated_at)
                 VALUES ($1, $2, NOW(), NOW())
                 ON CONFLICT (user_id) DO UPDATE SET
                    last_summary    = EXCLUDED.last_summary,
                    last_summary_at = NOW(),
                    updated_at      = NOW()`,
                [userId, summary],
            );
        } catch (error) {
            throw new RepositoryError('Failed to update conversation summary', error);
        }
    }
}
