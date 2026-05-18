export declare const ADMIN_EMAILS: readonly string[];
export interface IdTokenClaims {
    admin?: boolean;
    [key: string]: unknown;
}
export declare function isAdminUser(claims: IdTokenClaims | undefined | null, email: string | null | undefined): boolean;
//# sourceMappingURL=admin.d.ts.map