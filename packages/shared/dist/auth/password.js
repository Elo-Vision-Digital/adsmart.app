"use strict";
// Password policy shared between client (LoginPage signup, SettingsPage
// change-password) and Identity Platform configuration. Pre-ADR-016 the
// client signup enforced this exact rule but SettingsPage accepted 6 chars
// (drift). Identity Platform's own Password Policy (Firebase Console →
// Authentication → Settings → Password policy) must mirror this — see
// docs/DEPLOYMENT.md Phase H.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordSchema = exports.PasswordPolicy = exports.PASSWORD_MAX_LENGTH = exports.PASSWORD_MIN_LENGTH = void 0;
exports.validatePassword = validatePassword;
const zod_1 = require("zod");
exports.PASSWORD_MIN_LENGTH = 8;
exports.PASSWORD_MAX_LENGTH = 4096; // Firebase Auth hard limit
exports.PasswordPolicy = {
    minLength: exports.PASSWORD_MIN_LENGTH,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
};
exports.PasswordSchema = zod_1.z
    .string()
    .min(exports.PASSWORD_MIN_LENGTH)
    .max(exports.PASSWORD_MAX_LENGTH)
    .refine((v) => /[A-Z]/.test(v), { message: 'requireUppercase' })
    .refine((v) => /[a-z]/.test(v), { message: 'requireLowercase' })
    .refine((v) => /\d/.test(v), { message: 'requireNumber' })
    .refine((v) => /[!@#$%^&*(),.?":{}|<>]/.test(v), { message: 'requireSpecial' });
function validatePassword(password) {
    const errors = [];
    if (password.length < exports.PASSWORD_MIN_LENGTH)
        errors.push('passwordPolicy.tooShort');
    if (!/[A-Z]/.test(password))
        errors.push('passwordPolicy.requireUppercase');
    if (!/[a-z]/.test(password))
        errors.push('passwordPolicy.requireLowercase');
    if (!/\d/.test(password))
        errors.push('passwordPolicy.requireNumber');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
        errors.push('passwordPolicy.requireSpecial');
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=password.js.map