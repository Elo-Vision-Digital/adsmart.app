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
exports.CampaignSchema = void 0;
const z = __importStar(require("zod"));
const adAccount_1 = require("./adAccount");
const firestore_1 = require("../firestore");
// Status arrives lowercased from the upstream Ads APIs (Google Ads:
// enabled/paused/removed/...; Meta: active/paused/archived/with_issues/...).
// Kept permissive until a real sync surfaces the full value set; tighten to
// z.enum once mapped.
exports.CampaignSchema = z.object({
    id: z.string(),
    accountId: z.string(),
    platform: adAccount_1.AdPlatformSchema,
    campaignId: z.string(),
    campaignName: z.string(),
    status: z.string(),
    budget: z.number().nonnegative().optional(),
    spend: z.number().nonnegative().optional(),
    impressions: z.number().int().nonnegative().optional(),
    clicks: z.number().int().nonnegative().optional(),
    objective: z.string().optional(),
    lastSyncAt: (0, firestore_1.zTimestamp)(),
});
//# sourceMappingURL=campaign.js.map