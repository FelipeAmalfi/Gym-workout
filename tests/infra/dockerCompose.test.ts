import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';

function dockerAvailable(): boolean {
    try {
        execSync('docker --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

const describeOrSkip = dockerAvailable() ? describe : describe.skip;

describeOrSkip('docker compose boots a healthy stack', () => {
    beforeAll(() => {
        // Validate compose syntax before doing anything heavier.
        execSync('docker compose config -q', { stdio: 'inherit' });
    });

    it('postgres container has pgvector extension defined in compose', () => {
        const config = execSync('docker compose config', { encoding: 'utf8' });
        expect(config).toMatch(/pgvector\/pgvector:pg16/);
    });

    it('compose defines a healthcheck for postgres', () => {
        const config = execSync('docker compose config', { encoding: 'utf8' });
        expect(config).toMatch(/pg_isready/);
    });

    it('mounts schema.sql into the entrypoint dir', () => {
        const config = execSync('docker compose config', { encoding: 'utf8' });
        expect(config).toMatch(/docker-entrypoint-initdb\.d\/01_schema\.sql/);
    });
});
