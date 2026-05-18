"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DASHBOARD_METRICS_MAX_RANGE_DAYS = exports.GetDashboardMetricsOutputSchema = exports.GetDashboardMetricsInputSchema = void 0;
const z = __importStar(require("zod"));
const MAX_RANGE_DAYS = 365;
exports.GetDashboardMetricsInputSchema = z
    .object({
    startDate: z.iso.datetime(),
    endDate: z.iso.datetime(),
})
    .refine((v) => new Date(v.endDate).getTime() >= new Date(v.startDate).getTime(), {
    message: 'endDate must be greater than or equal to startDate',
    path: ['endDate'],
})
    .refine((v) => {
    const days = (new Date(v.endDate).getTime() - new Date(v.startDate).getTime()) / 86_400_000;
    return days <= MAX_RANGE_DAYS;
}, { message: `range exceeds ${MAX_RANGE_DAYS} days`, path: ['endDate'] });
const PlatformSchema = z.enum(['google_ads', 'meta_ads']);
exports.GetDashboardMetricsOutputSchema = z.object({
    range: z.object({
        startDate: z.iso.datetime(),
        endDate: z.iso.datetime(),
        days: z.number().int().nonnegative(),
    }),
    revenue: z.object({
        realCents: z.number().int().nonnegative(),
        creditsCents: z.number().int().nonnegative(),
        sparkline: z.array(z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
            realCents: z.number().int().nonnegative(),
            creditsCents: z.number().int().nonnegative(),
        })),
    }),
    users: z.object({
        newCount: z.number().int().nonnegative(),
        activeCount: z.number().int().nonnegative(),
        totalCount: z.number().int().nonnegative(),
        sparkline: z.array(z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
            newCount: z.number().int().nonnegative(),
        })),
    }),
    integrations: z.object({
        byPlatform: z.array(z.object({
            platform: PlatformSchema,
            distinctUserCount: z.number().int().nonnegative(),
        })),
    }),
    generatedAt: z.iso.datetime(),
});
exports.DASHBOARD_METRICS_MAX_RANGE_DAYS = MAX_RANGE_DAYS;
//# sourceMappingURL=dashboardMetrics.js.map