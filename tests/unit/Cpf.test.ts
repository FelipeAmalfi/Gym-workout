import { describe, it, expect } from 'vitest';
import { Cpf } from '../../src/core/domain/value-objects/Cpf.ts';
import { ValidationError } from '../../src/core/domain/errors/AppError.ts';

describe('Cpf', () => {
    describe('isValid', () => {
        it('accepts a valid CPF', () => {
            expect(Cpf.isValid('11144477735')).toBe(true);
        });

        it('accepts a formatted valid CPF (dots and dashes)', () => {
            expect(Cpf.isValid('111.444.777-35')).toBe(true);
        });

        it('rejects wrong-length CPFs', () => {
            expect(Cpf.isValid('123')).toBe(false);
            expect(Cpf.isValid('12345678901234')).toBe(false);
            expect(Cpf.isValid('')).toBe(false);
        });

        it('rejects all-equal digits', () => {
            expect(Cpf.isValid('11111111111')).toBe(false);
            expect(Cpf.isValid('00000000000')).toBe(false);
        });

        it('rejects wrong check digits', () => {
            expect(Cpf.isValid('11144477734')).toBe(false);
            expect(Cpf.isValid('11144477736')).toBe(false);
        });

        it('handles null/undefined gracefully', () => {
            expect(Cpf.isValid(null as unknown as string)).toBe(false);
            expect(Cpf.isValid(undefined as unknown as string)).toBe(false);
        });
    });

    describe('parse', () => {
        it('parses a valid CPF and stores only digits', () => {
            const cpf = Cpf.parse('111.444.777-35');
            expect(cpf.digits).toBe('11144477735');
            expect(cpf.toString()).toBe('11144477735');
        });

        it('throws ValidationError on invalid CPF', () => {
            expect(() => Cpf.parse('123')).toThrow(ValidationError);
        });
    });

    describe('tryParse', () => {
        it('returns Cpf instance for valid input', () => {
            const cpf = Cpf.tryParse('11144477735');
            expect(cpf).not.toBeNull();
            expect(cpf!.digits).toBe('11144477735');
        });

        it('returns null for invalid input instead of throwing', () => {
            expect(Cpf.tryParse('123')).toBeNull();
            expect(Cpf.tryParse('99999999999')).toBeNull();
        });
    });
});
