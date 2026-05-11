import { describe, it, expect } from 'vitest';
import {
    isDifficulty,
    validateDifficultyMap,
    resolveDifficultyFor,
    summarizeDifficulty,
    DIFFICULTY_LEVELS,
} from '../../src/core/domain/value-objects/Difficulty.ts';

describe('isDifficulty', () => {
    it.each(DIFFICULTY_LEVELS)('accepts %s', (lvl) => {
        expect(isDifficulty(lvl)).toBe(true);
    });
    it('rejects invalid values', () => {
        expect(isDifficulty('Pro')).toBe(false);
        expect(isDifficulty('')).toBe(false);
        expect(isDifficulty(null)).toBe(false);
        expect(isDifficulty(42)).toBe(false);
    });
});

describe('validateDifficultyMap', () => {
    it('returns empty when map is undefined', () => {
        const r = validateDifficultyMap(['Chest'], undefined);
        expect(r.sanitized).toEqual({});
        expect(r.extraMuscles).toEqual([]);
        expect(r.invalidValues).toEqual([]);
    });

    it('keeps entries matching the muscles list', () => {
        const r = validateDifficultyMap(['Chest', 'Back'], { Chest: 'Expert', Back: 'Beginner' });
        expect(r.sanitized).toEqual({ Chest: 'Expert', Back: 'Beginner' });
        expect(r.extraMuscles).toEqual([]);
    });

    it('rejects unknown muscles', () => {
        const r = validateDifficultyMap(['Chest'], { Chest: 'Expert', Wings: 'Beginner' });
        expect(r.sanitized).toEqual({ Chest: 'Expert' });
        expect(r.extraMuscles).toEqual(['Wings']);
    });

    it('rejects invalid difficulty values', () => {
        const r = validateDifficultyMap(['Chest'], { Chest: 'Pro' as never });
        expect(r.sanitized).toEqual({});
        expect(r.invalidValues).toEqual(['Chest=Pro']);
    });
});

describe('resolveDifficultyFor', () => {
    it('prefers per-muscle override', () => {
        expect(resolveDifficultyFor('Chest', { Chest: 'Expert' }, 'Beginner')).toBe('Expert');
    });
    it('falls back to global', () => {
        expect(resolveDifficultyFor('Chest', {}, 'Beginner')).toBe('Beginner');
    });
    it('defaults to Intermediate when nothing provided', () => {
        expect(resolveDifficultyFor('Chest', undefined, undefined)).toBe('Intermediate');
    });
});

describe('summarizeDifficulty', () => {
    it('returns fallback when present', () => {
        expect(summarizeDifficulty('Beginner', { Chest: 'Expert' })).toBe('Beginner');
    });
    it('returns most-common difficulty when no fallback', () => {
        expect(summarizeDifficulty(undefined, { Chest: 'Expert', Back: 'Expert', Legs: 'Beginner' })).toBe('Expert');
    });
    it('defaults to Intermediate when both are empty', () => {
        expect(summarizeDifficulty(undefined, undefined)).toBe('Intermediate');
        expect(summarizeDifficulty(undefined, {})).toBe('Intermediate');
    });
});
