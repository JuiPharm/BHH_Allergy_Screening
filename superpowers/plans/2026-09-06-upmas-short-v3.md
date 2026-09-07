# U-PMAS Short 3.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement U-PMAS Short 3.0 as a short privacy-first pediatric allergy Risk Index app with optional hospital contact-back and a fresh Google Sheets database.

**Architecture:** GitHub Pages provides the public parent experience and calls a Google Apps Script web app. Pure scoring/validation logic lives in `src/Core.js` for Node tests and Apps Script V8. Apps Script creates a fresh spreadsheet, stores non-PII assessment data separately from contact requests, and exposes staff views behind Google identity verification.

**Tech Stack:** HTML/CSS/vanilla JavaScript, Google Apps Script V8, Google Sheets, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-06-upmas-short-v3-design.md`

## Global Constraints
- `UPMAS-SHORT-3.0-DRAFT` is a pilot Risk Index, not disease probability.
- No GPS, `navigator.geolocation`, raw User-Agent storage, or browser fingerprinting.
- No direct identifiers before result; contact data only after explicit contact-back consent.
- Server recalculates Risk Index and safety classification.
- Create a new spreadsheet; never delete the previous spreadsheet.
- Emergency safety results remain separate from Risk Index.

---

### Task 1: Pure scoring, validation and metadata normalization
**Files:** Create `src/Core.js`; Test `tests/core.test.js`.
**Produces:** `validateAssessmentSubmission`, `calculateRiskAssessment`, `normalizeClientMeta`, `validateContactRequest`.
- [x] Write failing tests for weights, risk bands, uncertainty, safety override, no PII, metadata allowlist and contact validation.
- [x] Run `node --test tests/core.test.js` and verify RED.
- [x] Implement minimal pure functions.
- [x] Run test and verify GREEN.

### Task 2: Fresh spreadsheet schema and initialization
**Files:** Create `src/Repository.js`, `src/Schema.js`; Test `tests/schema.test.js`, `tests/backend_structure.test.js`.
**Produces:** `initializeFreshSystem`, `systemHealthCheck`, repository helpers and exact v3 schemas.
- [x] Write failing schema/structure tests.
- [x] Verify RED.
- [x] Implement fresh database creation and health check without legacy migration.
- [x] Verify GREEN.

### Task 3: Apps Script public API and contact-back endpoint
**Files:** Create `src/Code.js`, retain `src/Auth.js`, create `src/appsscript.json`; Test `tests/backend_structure.test.js`, `tests/transport.test.js`.
**Produces:** assessment submit/status JSONP, contact request submit, staff APIs.
- [x] Write failing tests for no PII in initial payload contract and separate contact action.
- [x] Verify RED.
- [x] Implement API and staff data access.
- [x] Verify GREEN.

### Task 4: Parent UI and Bangkok Hospital Hatyai theme
**Files:** Create `docs/index.html`, `docs/app.js`, `docs/ux.js`, `docs/styles.css`, `docs/api.js`, `docs/config.js`; Test `tests/app_structure.test.js`, `tests/ux.test.js`, `tests/ui_style.test.js`.
**Produces:** privacy-first 9-question wizard, conditional safety follow-up, Risk Index result, optional contact-back form, coarse metadata capture.
- [x] Write failing structure/UX/style tests.
- [x] Verify RED.
- [x] Implement HTML/JS/CSS.
- [x] Verify GREEN.

### Task 5: Staff dashboard
**Files:** Create `src/Admin.html`, `src/Styles.html`; Test `tests/backend_structure.test.js`, `tests/ui_style.test.js`.
**Produces:** Risk Index/contact queue dashboard and case detail without exposing contact data when absent.
- [x] Write failing dashboard tests.
- [x] Verify RED.
- [x] Implement dashboard.
- [x] Verify GREEN.

### Task 6: Deployment docs and complete verification
**Files:** Create `README_DEPLOY_V3.md`, `.claspignore`, `package.json`.
- [x] Document fresh database setup, Apps Script deployment, API URL update, GitHub Pages deployment and DPO/clinical governance blockers.
- [x] Run `npm test`.
- [x] Run `npm run check`.
- [x] Confirm no `navigator.geolocation` or raw User-Agent storage with repository grep.
- [x] Package zip with deployable `src/`, `docs/`, tests and docs.
