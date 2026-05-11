import type {
    ExerciseRetriever,
    ExerciseSearchQuery,
} from '../../src/core/application/ports/ExerciseRetriever.ts';
import type { RetrievedExercise } from '../../src/core/domain/entities/Exercise.ts';

export interface MockExerciseRow {
    id: number;
    title: string;
    description: string;
    bodyPart: string;
    equipment: string;
    level: string;
}

/**
 * In-memory deterministic retriever. Filters by muscle/equipment/difficulty exactly,
 * returns up to `limit` rows sorted by id.
 *
 * Use this for graph/flow tests where you do NOT need to exercise pgvector behavior.
 * Use the real PgVectorExerciseRetriever (with MockEmbedder) for tests/integration/rag/.
 */
export class MockExerciseRetriever implements ExerciseRetriever {
    readonly calls: ExerciseSearchQuery[] = [];

    constructor(private readonly rows: MockExerciseRow[]) {}

    async search(query: ExerciseSearchQuery): Promise<RetrievedExercise[]> {
        this.calls.push(query);
        const muscles = query.muscleGroups?.filter(Boolean) ?? [];
        const equipment = query.equipment?.filter(Boolean) ?? [];
        const level = query.difficulty;
        const limit = query.limit ?? 5;

        let filtered = this.rows.filter((r) => {
            if (muscles.length && !muscles.includes(r.bodyPart)) return false;
            if (equipment.length && !equipment.includes(r.equipment)) return false;
            if (level && r.level !== level) return false;
            return true;
        });

        // Multi-muscle fan-out is handled in CreateWorkoutUseCase; this mock returns the
        // single-muscle slice deterministically.
        filtered = filtered.slice(0, limit);

        return filtered.map((r, idx) => ({
            exerciseId: r.id,
            title: r.title,
            description: r.description,
            bodyPart: r.bodyPart,
            equipment: r.equipment,
            level: r.level,
            score: 1 - idx * 0.01,
        }));
    }
}
