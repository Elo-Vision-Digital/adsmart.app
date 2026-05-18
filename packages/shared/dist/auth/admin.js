"use strict";
// Single source of truth for AdSmart admin identity. Consumed by both the
// client (src/contexts/AuthContext.tsx) and Cloud Functions (priceManager,
// adminWalletManager, getDashboardMetrics). Pre-ADR-016 each consumer had
// its own copy; drift was observed in PR review and was the motivation for
// unifying here. See docs/Decisions.md ADR-016.
//
// The custom claim `admin === true` is the canonical authority. The email
// allowlist is a transition fallback so existing admins are not locked out
// before their custom claims are provisioned. Removal of the fallback is
// deferred to ADR-017 (see docs/SECURITY.md).
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_EMAILS = void 0;
exports.isAdminUser = isAdminUser;
exports.ADMIN_EMAILS = [
    'agency.elovisiondigital@gmail.com',
    'admin@adsmart.app',
];
function isAdminUser(claims, email) {
    if (claims?.admin === true)
        return true;
    if (!email)
        return false;
    return exports.ADMIN_EMAILS.includes(email);
}
//# sourceMappingURL=admin.js.map