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
        const queryText = query.muscleGroups?.length
            ? `exercises targeting ${query.muscleGroups.join(' and ')} muscles`
            : 'general fitness exercises';

        const filter: Record<string, string> = {};
        if (query.difficulty) filter['level'] = query.difficulty;
        if (query.equipment?.length === 1 && query.equipment[0]) filter['equipment'] = query.equipment[0];

        const results = await this.vectorStore.similaritySearchWithScore(
            queryText,
            query.limit ?? 5,
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
}
