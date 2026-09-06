# The Agency — Security Requirements

## 1. Security Objective

Protect:
- User accounts
- Personal data
- Product ownership
- Orders
- Payments
- Courier operations
- Administrative operations
- Platform infrastructure

Security is a release requirement, not a post-release enhancement.

## 2. Threat Model

Primary threat actors:
- Unauthenticated attacker
- Malicious registered user
- Fraudulent seller
- Fraudulent buyer
- Compromised courier account
- Compromised admin account
- Automated bot
- Malicious file uploader
- Payment/webhook attacker
- Stolen credential user

## 3. Authentication

Requirements:
- Strong password hashing
- Secure session/token handling
- Expiration
- Revocation
- Refresh rotation where applicable
- Email verification
- Password reset
- Login throttling
- Credential stuffing protection

Never store plaintext passwords.

## 4. Authorization

Every protected endpoint must validate:
1. Identity
2. Role/policy where required
3. Resource ownership
4. Resource state

Explicitly test BOLA/IDOR.

## 5. Input Validation

Validate all external input:
- Type
- Length
- Range
- Format
- Enum values
- Nested structures

Reject unknown/unexpected fields where appropriate.

## 6. Injection

Use parameterized queries/ORM mechanisms.

Never concatenate untrusted input into SQL.

Sanitize/encode user-generated content before rendering.

## 7. XSS

Product descriptions, seller information, reviews, and other user content are untrusted.

Prefer plain text unless rich text is explicitly required.

If rich text is introduced, use a strict allowlist sanitizer.

## 8. CSRF

If cookie-based authentication is used:
- Use appropriate SameSite settings.
- Use CSRF protection for state-changing requests where required.
- Validate origin/referer as an additional defense where appropriate.

## 9. CORS

Use an explicit allowlist.

Never use permissive production CORS without justification.

## 10. File Upload Security

Treat uploads as hostile.

Validate:
- Actual file content
- MIME
- Extension
- Size
- Dimensions

Prefer re-encoding images and stripping unnecessary metadata.

Use object storage and non-executable storage paths.

## 11. Rate Limiting

Protect:
- Login
- Registration
- Password reset
- Checkout
- Product creation
- Upload initialization
- Search
- Payment endpoints
- Administrative endpoints

Use adaptive limits where abuse risk is high.

## 12. Secrets

Never commit:
- API keys
- Passwords
- Tokens
- Private keys
- Payment secrets

Use environment variables or managed secret storage.

## 13. Logging

Never log:
- Passwords
- Access tokens
- Refresh tokens
- Payment credentials
- Full sensitive personal data

Logs should support investigation without becoming a data-leak vector.

## 14. Payment Security

- Verify webhook signatures.
- Validate event IDs.
- Deduplicate events.
- Prevent replay where possible.
- Do not trust frontend payment state.
- Do not store card data unless explicitly required and compliant.
- Prefer provider-hosted/tokenized payment flows.

## 15. Race Conditions

Critical state transitions must be transactionally safe.

Examples:
- Product purchase
- Reservation
- Payment finalization
- Courier assignment
- Delivery completion

## 16. Admin Security

Administrative access must use:
- Strong authentication
- Least privilege
- Explicit authorization policies
- Audit logs
- Rate limiting
- Session controls

Consider MFA before production.

## 17. Data Protection

Use TLS in transit.

Protect sensitive data at rest according to risk and provider capabilities.

Minimize stored personal data.

Define retention and deletion policies before production.

## 18. Security Testing

Required:
- Dependency scanning
- Static analysis
- API authorization tests
- Upload security tests
- Authentication tests
- Webhook security tests
- Concurrency tests
- Regression tests for every security finding

## 19. Release Gate

No release with:
- Open critical vulnerabilities
- Open high-severity authorization flaws
- Unverified payment webhooks
- Exposed secrets
- Unprotected administrative endpoints
- Known double-sale race condition

## 20. Incident Response

Production must support:
- Alerting
- Audit trails
- Credential/token revocation
- Account suspension
- Payment investigation
- Incident documentation

A future `INCIDENT_RESPONSE.md` should define operational procedures before production launch.
