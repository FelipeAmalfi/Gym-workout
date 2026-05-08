export abstract class AppError extends Error {
    abstract readonly code: string;
    abstract readonly httpStatus: number;

    readonly cause?: unknown;
    constructor(message: string, cause?: unknown) {
        super(message);
        this.name = this.constructor.name;
        this.cause = cause;
    }
}

export class ValidationError extends AppError {
    readonly code = 'VALIDATION_ERROR';
    readonly httpStatus = 400;
}

export class NotFoundError extends AppError {
    readonly code = 'NOT_FOUND';
    readonly httpStatus = 404;
}

export class AuthorizationError extends AppError {
    readonly code = 'FORBIDDEN';
    readonly httpStatus = 403;
}

export class LlmError extends AppError {
    readonly code = 'LLM_ERROR';
    readonly httpStatus = 502;
}

export class RepositoryError extends AppError {
    readonly code = 'REPOSITORY_ERROR';
    readonly httpStatus = 500;
}
