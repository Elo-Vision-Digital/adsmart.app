---
status: locked
version: 1
---

# CONTRACT — Sprint 0.8: Integrations Refactor

## Wave 1: Schema & Data Layer
- [ ] Create `packages/shared/src/schemas/project.ts` containing `ProjectSchema`.
- [ ] Update `AdAccountSchema` with optional `projectId` and `timezone`.
- [ ] Write Zod tests for `ProjectSchema` and run `typecheck`.

## Wave 2: Backend Cloud Functions
- [ ] Update `confirmGoogleAdsAccountSelection` payload to accept `accountsWithDetails` array (id, timezone, projectId).
- [ ] Update `confirmMetaAdsAccountSelection` payload to accept `accountsWithDetails` array.
- [ ] Validate function idempotency and save metadata correctly to Firestore.

## Wave 3: Frontend OAuth Popup & Callback
- [ ] Simplify `OAuthCallbackPage.tsx` to detect popup and use `postMessage` + `window.close()`.
- [ ] Refactor `IntegrationsPage.tsx`: remove global add button, add specific inline 'Conectar' buttons, clean up texts, and handle `message` event.
- [ ] Implement Pre-connect modal with safety warnings and "Continuar" button to trigger popup.

## Wave 4: Frontend Wizard & Projects
- [ ] Refactor `AccountSelectionModal.tsx` into a 3-step wizard (Accounts, Timezone, Project).
- [ ] Refactor `ProjectsPage.tsx`: remove mocks (`PROJECT_COLORS`, `SAMPLE_PROJECTS`), implement real Firestore listeners (`users/{uid}/projects`).
- [ ] Implement actual project creation in Firestore from both the wizard and the `ProjectsPage`.
