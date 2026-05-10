import type pg from 'pg';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Document } from '@langchain/core/documents';
import type {
    ExerciseRetriever,
    ExerciseSearchQuery,
} from '../../core/application/ports/ExerciseRetriever.ts';
import type { RetrievedExercise } from '../../core/domain/entities/Exercise.ts';
import type { ModelConfig } from '../../shared/config/modelConfig.ts';

const SCORE_THRESHOLD = 0.3;

type FilterValue = string | number | boolean | { in: (string | number | boolean)[] };
type MetadataFilter = Record<string, FilterValue>;

export class PgVectorExerciseRetriever implements ExerciseRetriever {
    private readonly vectorStore: PGVectorStore;

    constructor(pool: pg.Pool, config: ModelConfig) {
        const embeddings = new OpenAIEmbeddings({
            apiKey: config.apiKey,
            modelName: config.embeddingModel,
            configuration: {
                baseURL: 'https://openrouter.ai/api/v1',
            },
            dimensions: config.embeddingDimensions,
        });

        this.vectorStore = new PGVectorStore(embeddings, {
            pool,
            tableName: 'langchain_pg_embedding',
            columns: {
                idColumnName: 'uuid',
                vectorColumnName: 'embedding',
                contentColumnName: 'document',
                metadataColumnName: 'cmetadata',
            },
        });
    }

    async ensureTable(): Promise<void> {
        await this.vectorStore.ensureTableInDatabase();
    }

    async addDocuments(docs: Array<{ pageContent: string; metadata: Record<string, unknown> }>): Promise<void> {
        const langchainDocs = docs.map(
            (d) => new Document({ pageContent: d.pageContent, metadata: d.metadata }),
        );
        await this.vectorStore.addDocuments(langchainDocs);
    }

    async search(query: ExerciseSearchQuery): Promise<RetrievedExercise[]> {
        const muscles = query.muscleGroups?.filter(Boolean) ?? [];

        // Single-muscle / no-muscle: original behavior, unchanged contract.
        if (muscles.length <= 1) {
            return this.searchOne({
                muscle: muscles[0],
                equipment: query.equipment,
                difficulty: query.difficulty,
                limit: query.limit ?? 5,
            });
        }

        // Multi-muscle: fan out one search per muscle, dedupe, balance.
        const total = query.limit ?? 5;
        const perMuscle = Math.max(1, Math.ceil(total / muscles.length));

        const results = await Promise.all(
            muscles.map((muscle) =>
                this.searchOne({
                    muscle,
                    equipment: query.equipment,
                    difficulty: query.difficulty,
                    limit: perMuscle + 2, // small overshoot for dedupe headroom
                }),
            ),
        );

        return this.balancedMerge(muscles, results, total);
    }

    private async searchOne(args: {
        muscle?: string;
        equipment?: string[];
        difficulty?: string;
        limit: number;
    }): Promise<RetrievedExercise[]> {
        const queryText = args.muscle
            ? `exercises targeting ${args.muscle} muscles`
            : 'general fitness exercises';

        const filter: MetadataFilter = {};
        if (args.difficulty) filter['level'] = args.difficulty;
        if (args.muscle) filter['body_part'] = args.muscle;
        const equipment = args.equipment?.filter(Boolean) ?? [];
        if (equipment.length === 1) filter['equipment'] = equipment[0]!;
        else if (equipment.length > 1) filter['equipment'] = { in: equipment };

        const results = await this.vectorStore.similaritySearchWithScore(
            queryText,
            args.limit,
            Object.keys(filter).length ? filter : undefined,
        );

        return results
            .filter(([, score]) => score > SCORE_THRESHOLD)
            .map(([doc, score]) => ({
                exerciseId: doc.metadata['exercise_id'] as number,
                title: doc.metadata['title'] as string,
                description: doc.pageContent,
                bodyPart: doc.metadata['body_part'] as string,
                equipment: doc.metadata['equipment'] as string,
                level: doc.metadata['level'] as string,
                score,
            }));
    }

    private balancedMerge(
        muscles: string[],
        perMuscleResults: RetrievedExercise[][],
        total: number,
    ): RetrievedExercise[] {
        const seen = new Set<number>();
        const merged: RetrievedExercise[] = [];
        const cursors = muscles.map(() => 0);

        // Round-robin: take one exercise per muscle until we have `total` or all queues drained.
        while (merged.length < total) {
            let progressed = false;
            for (let i = 0; i < muscles.length && merged.length < total; i++) {
                const queue = perMuscleResults[i] ?? [];
                while (cursors[i]! < queue.length) {
                    const candidate = queue[cursors[i]!]!;
                    cursors[i] = cursors[i]! + 1;
                    if (!seen.has(candidate.exerciseId)) {
                        seen.add(candidate.exerciseId);
                        merged.push(candidate);
                        progressed = true;
                        break;
                    }
                }
            }
            if (!progressed) break;
        }

        return merged;
    }
}
