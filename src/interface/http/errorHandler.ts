import type { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod/v3';
import { AppError } from '../../core/domain/errors/AppError.ts';

export function registerErrorHandler(app: FastifyInstance): void {
    app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        if (error instanceof AppError) {
            request.log.warn({ err: error }, 'Domain error');
            return reply.status(error.httpStatus).send({
                error: error.code,
                message: error.message,
            });
        }

        if (error instanceof ZodError) {
            return reply.status(400).send({
                error: 'VALIDATION_ERROR',
                message: 'Invalid request payload',
                issues: error.errors,
            });
        }

        if (error.validation) {
            return reply.status(400).send({
                error: 'VALIDATION_ERROR',
                message: error.message,
            });
        }

        request.log.error({ err: error }, 'Unhandled error');
        return reply.status(error.statusCode ?? 500).send({
            error: 'INTERNAL_ERROR',
            message: 'Internal server error',
        });
    });
}
