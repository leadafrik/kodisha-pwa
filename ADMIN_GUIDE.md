# Kodisha Admin Guide

(Identical content moved from parent directory; version control placement corrected.)

## 1. Purpose & Scope
This guide equips platform administrators and moderators to safely operate Kodisha: review listings and documents, manage payments, monitor health, and respond to incidents. It complements existing documents: `backend/BACKUP_AND_RECOVERY.md`, `SECURITY.md`, `DATABASE_MONITORING.md`.

## 2. Access & Authentication
- Admin Login Endpoint: `POST /api/admin-auth/login` (phone + password). Email optional if implemented.
- Token: Returned JWT; stored in `localStorage` as `kodisha_admin_token` (mirrored to `kodisha_token` for shared protected routes).
- Session Lifetime: 7 days (per JWT issuance). Force re-login after privilege changes.
- Never share tokens; revoke immediately if compromise suspected (rotate `JWT_SECRET`).

## 3. Admin Responsibilities (High-Level)
- Trust & Safety: Verify users, land ownership, business legitimacy.
- Content Quality: Approve or reject listings; enforce guidelines.
- Payment Integrity: Monitor mock vs production M-Pesa flows and reconciliation.
- Security Hygiene: Watch for suspicious access patterns, brute force attempts.
- Operational Health: Track system metrics, error rates, queue backlogs (future).

## 4. Core Interfaces / Panels
(Front-end pages may evolve; ensure they are behind admin route guards.)
1. Admin Dashboard (planned): KPIs (new listings, pending verifications, payment success rate).
2. Pending Listings View: Filter by category (land, agrovet, service, product). Actions: Approve / Reject / Request edits.
3. Verification Review Panel: Documents grouped by user (ID front/back, selfie, land docs, business docs). Actions: Approve / Reject with reason.
4. Payment Test Panel (`/payment-test`): For dev only; remove or restrict in production.
5. Metrics Panel (future): Summaries from `/api/metrics`.

## 5. Listing Moderation Workflow
1. Submission enters status "pending".
2. Review Criteria:
   - Completeness: Title, description, category, pricing, location (county / constituency / ward if required).
   - Media: Clear, relevant photos; reject misleading or watermarked spam.
   - Policy Compliance: No prohibited content (fraudulent offers, offensive language).
3. Actions:
   - Approve: Listing becomes visible immediately if user verification sufficient.
   - Reject: Provide reason; encourage re-submission after fix.
   - Hold: If payment pending or verification incomplete; add internal note.
4. Audit Trail (future): Record moderator ID, timestamp, action, reason.

## 6. User & Document Verification
Documents required vary by intended platform use:
- Identity: National ID (front/back) + selfie match.
- Land Ownership (for selling, optional for rental): Title deed + land search report OR chief letter.
- Business/Service: Business permit, certificates, shop/equipment photos.
Review Steps:
1. Confirm legibility & authenticity (names match user profile, document IDs consistent).
2. Check for tampering (odd artifacts, mismatched aspect ratios, cropped seals).
3. If uncertain: Mark as "pending_review" and request clarification.
Statuses Managed:
- `not_started` | `pending_review` | `approved` | `rejected`.
Security Notes:
- Do NOT download documents locally unless needed for escalation.
- Ensure storage uses restricted access (migrate from local uploads to secure bucket when scaling).

## 7. Payments & M-Pesa Handling
Environment Flags (in backend `.env`):
- `MPESA_USE_MOCK=true` enables mock service (no live API calls).
- `MPESA_AUTO_CALLBACK=true` simulates instant success callback.
Admin Tasks:
1. Monitor payment initiation requests for abuse (rapid repeated attempts, mismatch of user/listing).
2. When production is enabled:
   - Ensure callback URL is whitelisted and reachable.
   - Verify transaction reconciliation daily (success vs captured listing activations).
3. Investigate Failures:
   - Cross-check backend logs (add correlation IDs) & M-Pesa API response codes.
   - Re-run callback manually only if idempotency implemented.
4. Refunds (future): Manual process until automated flow defined.

## 8. Metrics & Monitoring
API: `GET /api/metrics` (current simple metrics route). Expand to include:
- Listing funnel counts (submitted, approved, rejected).
- Verification backlog (pending review count).
- Payment success/failure ratio (24h / 7d).
- Error Rates: 4xx vs 5xx by endpoint.
Admin Routine:
- Daily: Scan error spikes; identify endpoints needing rate limiting or validation tightening.
- Weekly: Review approval turnaround time; target <24h for verification.

## 9. Security & Compliance Essentials
Reference: `SECURITY.md`
- Password Handling: Bcrypt; never view plaintext passwords.
- JWT Handling: Admin tokens carry elevated privilege—log all admin actions.
- Rate Limiting: Ensure auth & upload endpoints enforce limits; report anomalies.
- Secrets: Validate CI secret scanning reports (future automation). If leak suspected, rotate immediately.
- Sensitive Data: Treat ID documents as PII; restrict any export or sharing.
- Fraud Patterns: Multiple high-value listings from new accounts; sudden payment bursts; mismatched user identity vs docs.

## 10. Incident Response Checklist
Trigger Examples: Payment outage, data exposure risk, mass failed logins, document storage breach.
1. Contain: Disable affected endpoints or toggle feature flags.
2. Assess: Gather logs (timestamp, IP, user IDs, actions). Preserve evidence.
3. Communicate: Internal notification (create incident ticket). External user messaging only if user impact.
4. Remediate: Patch vulnerability; rotate compromised secrets; force token invalidation if needed.
5. Review: Post-mortem (root cause, timeline, fixes, prevention steps). Store securely.
6. Improve: Update this guide & automation scripts.

## 11. Routine Admin Task Calendar
Daily:
- Approve/reject listings & docs.
- Check payment callbacks & error logs.
Weekly:
- Analyze verification backlog & listing rejection reasons.
- Review suspicious patterns (new accounts with premium plans).
Monthly:
- Secret rotation review (if any due).
- Backup validation test (refer `BACKUP_AND_RECOVERY.md`).
- Policy refresh (update prohibited content list as needed).

## 12. Backup & Recovery (Summary)
See `backend/BACKUP_AND_RECOVERY.md` for full details.
- Confirm backups succeeded (integrity check & timestamp).
- Test restore in staging monthly.
- In recovery: prioritize user + payment data consistency, then documents, then analytics.

## 13. Logging & Audit (Planned Enhancements)
- Correlation IDs per request (`X-Request-ID`).
- Structured admin action logs collection (`admin_actions` collection or table).
- Tamper-evident hashing for document verification state changes.

## 14. Data & Analytics (Forward-Looking)
Add event tracking for:
- Listing creation start → completion.
- Payment initiation → success.
- Verification start → approval timeline.
Use aggregated dashboards to adjust platform policies (e.g., highlight documentation pain points).

## 15. Escalation Paths
- Technical Issues: Flag to engineering lead (or AI agent for triage).
- Security Concerns: Immediate secret rotation + incident checklist.
- Legal Requests: Escalate—do NOT unilaterally disclose data.

## 16. Future Improvements Roadmap
- Automated risk scoring for listings.
- Bulk moderation tools (batch approve similar low-risk listings).
- ML-assisted document authenticity pre-screen.
- Automated payment reconciliation + alerting.

## 17. Quick Reference
| Area | Primary Endpoint / Tool | Action |
|------|-------------------------|--------|
| Admin Login | `/api/admin-auth/login` | Obtain token |
| Listings | `/api/admin/listings/pending` | Review queue |
| Verification Status | `/api/verification/status/:userId` | Inspect docs |
| Payments (Dev) | `/payment-test` page | Simulate flows |
| Metrics | `/api/metrics` | Health snapshot |
| Home Root | `/` | Basic server status |

## 18. Maintaining This Guide
- Update upon adding new document types, moderation states, payment flows, or incident categories.
- Version with date stamp at top when materially changed.

_Last updated: INITIAL VERSION (moved into repo)_
