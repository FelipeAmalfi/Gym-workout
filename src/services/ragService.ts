import { OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import pg from 'pg';

export interface RetrievedExercise {
    exerciseId: number;
    title: string;
    description: string;
    bodyPart: string;
    equipment: string;
    level: string;
    score: number;
}

export interface SearchParams {
    muscleGroups?: string[];
    equipment?: string[];
    difficulty?: string;
    limit?: number;
}

export class RagService {
    private vectorStore: PGVectorStore;

    constructor(pool: pg.Pool, openrouterApiKey: string) {
        const embeddings = new OpenAIEmbeddings({
            apiKey: openrouterApiKey,
            modelName: 'text-embedding-3-small',
            configuration: {
                baseURL: 'https://openrouter.ai/api/v1',
            },
            dimensions: 1536,
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
        const { Document } = await import('@langchain/core/documents');
        const langchainDocs = docs.map(d => new Document({ pageContent: d.pageContent, metadata: d.metadata }));
        await this.vectorStore.addDocuments(langchainDocs);
    }

    async searchExercises(params: SearchParams): Promise<RetrievedExercise[]> {
        const queryText = params.muscleGroups?.length
            ? `exercises targeting ${params.muscleGroups.join(' and ')} muscles`
            : 'general fitness exercises';

        const filter: Record<string, unknown> = {};
        if (params.difficulty) {
            filter['level'] = params.difficulty;
        }
        if (params.equipment?.length === 1) {
            filter['equipment'] = params.equipment[0];
        }

        const results = await this.vectorStore.similaritySearchWithScore(
            queryText,
            params.limit ?? 5,
            Object.keys(filter).length ? filter : undefined,
        );

        return results
            .filter(([, score]) => score > 0.3)
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
