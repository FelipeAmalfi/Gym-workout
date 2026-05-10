export const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Expert'] as const;
export type Difficulty = typeof DIFFICULTY_LEVELS[number];

export type DifficultyByMuscle = Record<string, Difficulty>;

export const VALID_MUSCLE_GROUPS = [
    'Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves', 'Chest',
    'Forearms', 'Glutes', 'Hamstrings', 'Lats', 'Lower Back', 'Middle Back',
    'Neck', 'Quadriceps', 'Shoulders', 'Traps', 'Triceps',
] as const;

export const VALID_EQUIPMENT = [
    'Bands', 'Barbell', 'Body Only', 'Cable', 'Dumbbell', 'E-Z Curl Bar',
    'Exercise Ball', 'Foam Roll', 'Kettlebells', 'Machine', 'Medicine Ball', 'None', 'Other',
] as const;

export function isDifficulty(value: unknown): value is Difficulty {
    return typeof value === 'string' && (DIFFICULTY_LEVELS as readonly string[]).includes(value);
}

export interface DifficultyMapValidation {
    sanitized: DifficultyByMuscle;
    extraMuscles: string[];
    invalidValues: string[];
}

export function validateDifficultyMap(
    muscles: string[],
    map: DifficultyByMuscle | undefined,
): DifficultyMapValidation {
    const sanitized: DifficultyByMuscle = {};
    const extraMuscles: string[] = [];
    const invalidValues: string[] = [];
    if (!map) return { sanitized, extraMuscles, invalidValues };

    const known = new Set(muscles);
    for (const [muscle, level] of Object.entries(map)) {
        if (!known.has(muscle)) {
            extraMuscles.push(muscle);
            continue;
        }
        if (!isDifficulty(level)) {
            invalidValues.push(`${muscle}=${String(level)}`);
            continue;
        }
        sanitized[muscle] = level;
    }
    return { sanitized, extraMuscles, invalidValues };
}

export function resolveDifficultyFor(
    muscle: string,
    byMuscle: DifficultyByMuscle | undefined,
    fallback: Difficulty | undefined,
): Difficulty {
    return byMuscle?.[muscle] ?? fallback ?? 'Intermediate';
}

export function summarizeDifficulty(
    fallback: Difficulty | undefined,
    byMuscle: DifficultyByMuscle | undefined,
): Difficulty {
    if (fallback) return fallback;
    const values = Object.values(byMuscle ?? {});
    if (values.length === 0) return 'Intermediate';
    const counts = new Map<Difficulty, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    let best: Difficulty = values[0]!;
    let bestCount = -1;
    for (const [v, c] of counts) {
        if (c > bestCount) { best = v; bestCount = c; }
    }
    return best;
}
