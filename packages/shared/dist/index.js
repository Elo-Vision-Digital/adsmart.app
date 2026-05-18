"use strict";
// @adsmart/shared — Zod schemas for Firestore documents shared between
// apps/web (frontend) and functions/ (Cloud Functions).
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.PasswordSchema = exports.PasswordPolicy = exports.PASSWORD_MAX_LENGTH = exports.PASSWORD_MIN_LENGTH = exports.isAdminUser = exports.ADMIN_EMAILS = exports.DASHBOARD_METRICS_MAX_RANGE_DAYS = exports.GetDashboardMetricsOutputSchema = exports.GetDashboardMetricsInputSchema = exports.TransactionTypeSchema = exports.TransactionStatusSchema = exports.TransactionSchema = exports.UserWalletSchema = exports.CampaignSchema = exports.AdPlatformSchema = exports.AdAccountSchema = exports.DateRangeSchema = exports.ReportTypeSchema = exports.ReportStatusSchema = exports.ReportSchema = exports.zTimestamp = void 0;
var firestore_1 = require("./firestore");
Object.defineProperty(exports, "zTimestamp", { enumerable: true, get: function () { return firestore_1.zTimestamp; } });
var report_1 = require("./schemas/report");
Object.defineProperty(exports, "ReportSchema", { enumerable: true, get: function () { return report_1.ReportSchema; } });
Object.defineProperty(exports, "ReportStatusSchema", { enumerable: true, get: function () { return report_1.ReportStatusSchema; } });
Object.defineProperty(exports, "ReportTypeSchema", { enumerable: true, get: function () { return report_1.ReportTypeSchema; } });
Object.defineProperty(exports, "DateRangeSchema", { enumerable: true, get: function () { return report_1.DateRangeSchema; } });
var adAccount_1 = require("./schemas/adAccount");
Object.defineProperty(exports, "AdAccountSchema", { enumerable: true, get: function () { return adAccount_1.AdAccountSchema; } });
Object.defineProperty(exports, "AdPlatformSchema", { enumerable: true, get: function () { return adAccount_1.AdPlatformSchema; } });
var campaign_1 = require("./schemas/campaign");
Object.defineProperty(exports, "CampaignSchema", { enumerable: true, get: function () { return campaign_1.CampaignSchema; } });
var userWallet_1 = require("./schemas/userWallet");
Object.defineProperty(exports, "UserWalletSchema", { enumerable: true, get: function () { return userWallet_1.UserWalletSchema; } });
var transaction_1 = require("./schemas/transaction");
Object.defineProperty(exports, "TransactionSchema", { enumerable: true, get: function () { return transaction_1.TransactionSchema; } });
Object.defineProperty(exports, "TransactionStatusSchema", { enumerable: true, get: function () { return transaction_1.TransactionStatusSchema; } });
Object.defineProperty(exports, "TransactionTypeSchema", { enumerable: true, get: function () { return transaction_1.TransactionTypeSchema; } });
var dashboardMetrics_1 = require("./schemas/dashboardMetrics");
Object.defineProperty(exports, "GetDashboardMetricsInputSchema", { enumerable: true, get: function () { return dashboardMetrics_1.GetDashboardMetricsInputSchema; } });
Object.defineProperty(exports, "GetDashboardMetricsOutputSchema", { enumerable: true, get: function () { return dashboardMetrics_1.GetDashboardMetricsOutputSchema; } });
Object.defineProperty(exports, "DASHBOARD_METRICS_MAX_RANGE_DAYS", { enumerable: true, get: function () { return dashboardMetrics_1.DASHBOARD_METRICS_MAX_RANGE_DAYS; } });
var admin_1 = require("./auth/admin");
Object.defineProperty(exports, "ADMIN_EMAILS", { enumerable: true, get: function () { return admin_1.ADMIN_EMAILS; } });
Object.defineProperty(exports, "isAdminUser", { enumerable: true, get: function () { return admin_1.isAdminUser; } });
var password_1 = require("./auth/password");
Object.defineProperty(exports, "PASSWORD_MIN_LENGTH", { enumerable: true, get: function () { return password_1.PASSWORD_MIN_LENGTH; } });
Object.defineProperty(exports, "PASSWORD_MAX_LENGTH", { enumerable: true, get: function () { return password_1.PASSWORD_MAX_LENGTH; } });
Object.defineProperty(exports, "PasswordPolicy", { enumerable: true, get: function () { return password_1.PasswordPolicy; } });
Object.defineProperty(exports, "PasswordSchema", { enumerable: true, get: function () { return password_1.PasswordSchema; } });
Object.defineProperty(exports, "validatePassword", { enumerable: true, get: function () { return password_1.validatePassword; } });
//# sourceMappingURL=index.js.map