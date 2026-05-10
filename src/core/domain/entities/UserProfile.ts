import type { Difficulty } from '../value-objects/Difficulty.ts';

export interface GoalMention {
    fact: string;
    capturedAt: string;
}

export interface UserPreferences {
    preferredMuscles?: string[];
    preferredDifficulty?: Difficulty;
    preferredEquipment?: string[];
    defaultNumExercises?: number;
    goalsMentioned?: GoalMention[];
    lastSummary?: string;
    lastSummaryAt?: string;
}

export interface UserProfile extends UserPreferences {
    userId: number;
}
