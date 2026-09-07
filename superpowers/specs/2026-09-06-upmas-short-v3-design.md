# U-PMAS Short 3.0 Design

## Goal
Create a short parent-facing pediatric allergy risk assessment for Bangkok Hospital Hatyai that is privacy-first, mobile-first, and clearly non-diagnostic.

## Clinical positioning
- U-PMAS Short 3.0 produces a **Risk Index 0–100**, not an individualized probability of disease.
- The index is a DRAFT/PILOT evidence-informed score and must never be described as “72% chance of allergy”.
- Safety findings are separate from the Risk Index. A current severe reaction overrides normal result presentation with emergency guidance.

## Assessment flow
1. Landing page with layered privacy notice and assessment consent.
2. No name or phone number is requested before the result.
3. Collect age band, self-reported province and optional district.
4. Ask 9 core questions, one card at a time.
5. If reaction history is positive, show conditional trigger/severity/current-emergency questions.
6. Backend validates and recalculates the Risk Index.
7. Show Risk Index, contributing factors, safety message, and caring Bangkok Hospital Hatyai copy.
8. Offer optional contact-back. Only then collect parent name, phone, preferred contact time, and separate contact consent.

## Nine core questions and weights
1. First-degree family atopy: 0 / 10 / 20 points; max 20.
2. Mode of delivery: vaginal 0, C-section 5, unknown 0 + uncertainty; max 5.
3. Feeding in first 3–4 months: exclusive breastmilk 0, mixed 2, not exclusive/formula 5, unknown 0 + uncertainty; max 5.
4. Early infant eczema: yes 20; max 20.
5. Recurrent wheeze/lower-airway symptoms in previous 12 months: yes 15; max 15.
6. Recurrent rhinitis/ocular symptoms without cold in previous 12 months: yes 10; max 10.
7. Current recurrent eczema: yes 10; max 10.
8. Reproducible symptoms after food/drug/insect exposure: yes 10; max 10.
9. Regular indoor smoke or visible mold/damp exposure: yes 5; max 5.

Risk bands are provisional:
- 0–29: พบปัจจัยที่เกี่ยวข้องค่อนข้างน้อย
- 30–59: พบปัจจัยที่ควรให้ความสนใจบางประการ
- 60–100: พบปัจจัยสำคัญหลายประการ

Unknown answers add an uncertainty count but do not add risk points. When uncertaintyCount >= 3, result copy must flag limited certainty.

## Safety logic
A positive reaction-history answer opens follow-up questions:
- trigger: food / drug / insect / unsure
- previous severe symptoms: breathing difficulty, throat/voice swelling/change, fainting/collapse
- current severe symptoms now: yes/no

Safety levels:
- EMERGENCY_NOW: current severe symptoms now = yes.
- SAFETY_FOLLOWUP: previous severe systemic symptoms = yes but not current.
- ROUTINE: otherwise.

Emergency copy tells users not to wait for a callback and to seek emergency care; Thailand EMS 1669 may be shown.

## Privacy and data minimization
Assessment stage does not collect direct identifiers. It stores health answers, age band, self-reported location, timestamp, and coarse technical analytics.

Allowed analytics:
- browserFamily
- browserMajor
- osFamily
- deviceType
- screenBucket
- viewportBucket
- language
- timezone

Not collected:
- GPS / navigator.geolocation
- exact latitude/longitude
- full raw User-Agent string
- fingerprinting identifiers
- device serial/model identifiers

Location source is always `self_reported`; province may be `PREFER_NOT_TO_SAY`; district is optional.

Separate consents:
- assessment consent before questionnaire
- contact-back consent after result

Contact information is stored only in `ContactRequests`, not in assessment rows.

## Fresh database
This release intentionally uses a new Google Spreadsheet and does not migrate legacy rows. `initializeFreshSystem()` creates a new spreadsheet, seeds configuration, stores the new `SPREADSHEET_ID`, and leaves any previous spreadsheet untouched.

Sheets:
- Cases
- Assessments
- ContactRequests
- Organizations
- Users
- Notes
- AuditLogs
- Settings

## Staff dashboard
List: assessment time, age band, area, Risk Index, risk band, safety level, contact requested/status.
Detail: nine answers, conditional safety answers, risk reasons, coarse technical metadata, and contact request details only when contact consent exists.

## Brand and UX
- Mobile-first one-question-per-screen flow.
- Hospital-style white and blue design, restrained medical aesthetic, rounded cards, large touch targets, explicit focus states.
- Risk colors use blue intensity; red is reserved for emergency/safety warnings.
- Caring result copy communicates Bangkok Hospital Hatyai support and availability of pediatric allergy/immunology expertise.
- Link to Bangkok Hospital/BDMS privacy notice and pediatric allergy specialist/service information.

## Backend trust boundary
Browser may preview progress but server is authoritative for validation, scoring, safety classification, stored metadata normalization, and result text.

## Versioning
- questionnaireVersion: `UPMAS-SHORT-3.0-DRAFT`
- scoreModelVersion: `RISK-INDEX-3.0-DRAFT`
- assessmentConsentVersion: `UPMAS-ASSESSMENT-PRIVACY-1.0-DRAFT`
- contactConsentVersion: `UPMAS-CONTACT-1.0-DRAFT`

All DRAFT labels remain until clinical governance and DPO/privacy review are complete.
