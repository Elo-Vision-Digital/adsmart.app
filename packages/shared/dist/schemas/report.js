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
exports.ReportSchema = exports.DateRangeSchema = exports.ReportStatusSchema = exports.ReportTypeSchema = void 0;
const z = __importStar(require("zod"));
const firestore_1 = require("../firestore");
exports.ReportTypeSchema = z.enum(['google_ads', 'meta_ads']);
exports.ReportStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);
exports.DateRangeSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
});
exports.ReportSchema = z.object({
    id: z.string(),
    userId: z.string(),
    type: exports.ReportTypeSchema,
    templateId: z.string(),
    name: z.string(),
    status: exports.ReportStatusSchema,
    campaignIds: z.array(z.string()).optional(),
    allCampaigns: z.boolean().default(false),
    dateRange: exports.DateRangeSchema.default({ startDate: '', endDate: '' }),
    lookerStudioUrl: z.url().optional(),
    cost: z.number().int().nonnegative().default(0),
    paidAt: (0, firestore_1.zTimestamp)().optional(),
    createdAt: (0, firestore_1.zTimestamp)(),
    completedAt: (0, firestore_1.zTimestamp)().optional(),
    error: z.string().optional(),
});
//# sourceMappingURL=report.js.map