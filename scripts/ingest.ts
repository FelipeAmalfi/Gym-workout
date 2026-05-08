import { createReadStream } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse';
import { loadEnv } from '../src/shared/config/env.ts';
import { buildModelConfig } from '../src/shared/config/modelConfig.ts';
import { createPool } from '../src/infrastructure/database/pgPool.ts';
import { PgVectorExerciseRetriever } from '../src/infrastructure/vector/PgVectorExerciseRetriever.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(__dirname, '..', 'megaGymDataset.csv');
const BATCH_SIZE = 50;

interface CsvRow {
    Title: string;
    Desc: string;
    Type: string;
    BodyPart: string;
    Equipment: string;
    Level: string;
    Rating: string;
    RatingDesc: string;
}

async function parseCsv(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolveCsv, reject) => {
        const rows: CsvRow[] = [];
        createReadStream(filePath)
            .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
            .on('data', (row: CsvRow) => rows.push(row))
            .on('end', () => resolveCsv(rows))
            .on('error', reject);
    });
}

async function ingest() {
    console.log('🚀 Starting CSV ingestion...\n');

    const env = loadEnv();
    const modelConfig = buildModelConfig(env);
    const pool = createPool(env);

    console.log(`📄 Parsing ${CSV_PATH}...`);
    const rows = await parseCsv(CSV_PATH);
    console.log(`✅ Parsed ${rows.length} rows\n`);

    console.log('💾 Inserting exercises into database...');
    const exerciseMap: Map<string, number> = new Map();

    for (const [idx, row] of rows.entries()) {
        if (!row.Title?.trim()) continue;
        const result = await pool.query<{ id: number }>(
            `INSERT INTO exercises (title, description, type, body_part, equipment, level, rating, rating_desc)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT DO NOTHING
             RETURNING id`,
            [
                row.Title?.trim() || null,
                row.Desc?.trim() || null,
                row.Type?.trim() || null,
                row.BodyPart?.trim() || null,
                row.Equipment?.trim() || null,
                row.Level?.trim() || null,
                row.Rating?.trim() ? parseFloat(row.Rating) : null,
                row.RatingDesc?.trim() || null,
            ],
        );
        const id = result.rows[0]?.id ?? null;
        if (id !== null) exerciseMap.set(row.Title.trim(), id);
        if ((idx + 1) % 500 === 0) console.log(`   Inserted ${idx + 1}/${rows.length}`);
    }
    console.log(`✅ Inserted ${exerciseMap.size} exercises\n`);

    console.log('🔢 Building documents...');
    const documents: Array<{ pageContent: string; metadata: Record<string, unknown> }> = [];

    for (const row of rows) {
        const title = row.Title?.trim();
        if (!title || !exerciseMap.has(title)) continue;

        const exerciseId = exerciseMap.get(title)!;
        const content = [title, row.Desc?.trim()].filter(Boolean).join('. ');

        documents.push({
            pageContent: content,
            metadata: {
                exercise_id: exerciseId,
                title,
                body_part: row.BodyPart?.trim() ?? '',
                equipment: row.Equipment?.trim() ?? '',
                level: row.Level?.trim() ?? '',
                type: row.Type?.trim() ?? '',
            },
        });
    }
    console.log(`✅ Built ${documents.length} documents\n`);

    console.log('🔌 Connecting to pgvector store...');
    const retriever = new PgVectorExerciseRetriever(pool, modelConfig);
    await retriever.ensureTable();
    console.log('✅ Vector table ready\n');

    console.log(`📦 Embedding ${documents.length} documents in batches of ${BATCH_SIZE}...`);
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        await retriever.addDocuments(batch);
        console.log(`   Embedded ${Math.min(i + BATCH_SIZE, documents.length)} / ${documents.length}`);
    }

    await pool.end();
    console.log('\n✅ Ingestion complete!');
    console.log(`   ${exerciseMap.size} exercises in DB`);
    console.log(`   ${documents.length} vectors in pgvector`);
}

ingest().catch((err) => {
    console.error('❌ Ingestion failed:', err);
    process.exit(1);
});
