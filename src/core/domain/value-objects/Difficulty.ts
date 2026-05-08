export const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Expert'] as const;
export type Difficulty = typeof DIFFICULTY_LEVELS[number];

export const VALID_MUSCLE_GROUPS = [
    'Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves', 'Chest',
    'Forearms', 'Glutes', 'Hamstrings', 'Lats', 'Lower Back', 'Middle Back',
    'Neck', 'Quadriceps', 'Shoulders', 'Traps', 'Triceps',
] as const;

export const VALID_EQUIPMENT = [
    'Bands', 'Barbell', 'Body Only', 'Cable', 'Dumbbell', 'E-Z Curl Bar',
    'Exercise Ball', 'Foam Roll', 'Kettlebells', 'Machine', 'Medicine Ball', 'None', 'Other',
] as const;
