import { ValidationError } from '../errors/AppError.ts';

export class Cpf {
    readonly digits: string;
    private constructor(digits: string) { this.digits = digits; }

    static parse(raw: string): Cpf {
        const digits = (raw ?? '').replace(/\D/g, '');
        if (!Cpf.isValid(digits)) {
            throw new ValidationError(`Invalid CPF: ${raw}`);
        }
        return new Cpf(digits);
    }

    static tryParse(raw: string): Cpf | null {
        const digits = (raw ?? '').replace(/\D/g, '');
        return Cpf.isValid(digits) ? new Cpf(digits) : null;
    }

    static isValid(raw: string): boolean {
        const digits = (raw ?? '').replace(/\D/g, '');
        if (digits.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(digits)) return false;

        const calc = (slice: string, startWeight: number): number => {
            let sum = 0;
            let weight = startWeight;
            for (const ch of slice) {
                sum += Number.parseInt(ch, 10) * weight;
                weight--;
            }
            const remainder = sum % 11;
            return remainder < 2 ? 0 : 11 - remainder;
        };

        const d1 = calc(digits.slice(0, 9), 10);
        const d2 = calc(digits.slice(0, 10), 11);
        return (
            d1 === Number.parseInt(digits[9]!, 10) &&
            d2 === Number.parseInt(digits[10]!, 10)
        );
    }

    toString(): string {
        return this.digits;
    }
}
