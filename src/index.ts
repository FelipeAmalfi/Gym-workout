import { buildContainer } from './composition/container.ts';
import { createServer } from './interface/http/server.ts';

const container = buildContainer();
const app = createServer(container);

await app.listen({ port: container.env.PORT, host: container.env.HOST });
console.log(`🏋️  Gym Workout Server running on http://${container.env.HOST}:${container.env.PORT}`);
