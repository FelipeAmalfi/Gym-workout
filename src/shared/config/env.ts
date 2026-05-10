import { z } from 'zod/v3';

const EnvSchema = z.object({
    OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
    HTTP_REFERER: z.string().default('http://localhost:3000'),
    X_TITLE: z.string().default('Gym Workout Assistant'),

    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: z.preprocess(
        (v) => (v === undefined || v === '' ? undefined : Number(v)),
        z.number().int().positive().default(5432),
    ),
    POSTGRES_DB: z.string().default('gymworkout'),
    POSTGRES_USER: z.string().default('gym'),
    POSTGRES_PASSWORD: z.string().default('gympassword'),

    PORT: z.preprocess(
        (v) => (v === undefined || v === '' ? undefined : Number(v)),
        z.number().int().positive().default(3000),
    ),
    HOST: z.string().default('0.0.0.0'),

    LLM_MODELS: z.preprocess(
        (v) => {
            const s = v === undefined || v === '' ? 'openrouter/owl-alpha' : String(v);
            return s.split(',').map((m) => m.trim()).filter(Boolean);
        },
        z.array(z.string().min(1)).min(1),
    ),
    LLM_TEMPERATURE: z.preprocess(
        (v) => (v === undefined || v === '' ? undefined : Number(v)),
        z.number().min(0).max(2).default(0),
    ),
    EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
    EMBEDDING_DIMENSIONS: z.preprocess(
        (v) => (v === undefined || v === '' ? undefined : Number(v)),
        z.number().int().positive().default(1536),
    ),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

export function loadEnv(): Env {
    if (cached) return cached;
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
        const issues = parsed.error.errors
            .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
            .join('\n');
        throw new Error(`Invalid environment configuration:\n${issues}`);
    }
    cached = Object.freeze(parsed.data);
    return cached;
}
