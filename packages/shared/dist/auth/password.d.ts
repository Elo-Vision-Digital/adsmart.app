import { z } from 'zod';
export declare const PASSWORD_MIN_LENGTH = 8;
export declare const PASSWORD_MAX_LENGTH = 4096;
export declare const PasswordPolicy: {
    readonly minLength: 8;
    readonly requireUppercase: true;
    readonly requireLowercase: true;
    readonly requireNumber: true;
    readonly requireSpecial: true;
};
export declare const PasswordSchema: z.ZodString;
export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validatePassword(password: string): PasswordValidationResult;
//# sourceMappingURL=password.d.ts.map