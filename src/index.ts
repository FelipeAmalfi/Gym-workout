import { createServer } from './server.ts';

const app = createServer();

await app.listen({ port: 3000, host: '0.0.0.0' });
console.log('🏋️  Gym Workout Server running on http://0.0.0.0:3000');
