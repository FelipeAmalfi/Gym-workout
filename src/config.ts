export type ModelConfig = {
  apiKey: string;
  httpReferer: string;
  xTitle: string;
  provider: { sort: { by: string; partition: string } };
  models: string[];
  temperature: number;
};

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is not set');
}

export const config: ModelConfig = {
  apiKey: process.env.OPENROUTER_API_KEY!,
  httpReferer: process.env.HTTP_REFERER ?? 'http://localhost:3000',
  xTitle: process.env.X_TITLE ?? 'Gym Workout Assistant',
  models: ['openai/gpt-4o-mini'],
  provider: {
    sort: {
      by: 'throughput',
      partition: 'none',
    },
  },
  temperature: 0,
};
