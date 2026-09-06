# The Agency — Engineering Roadmap

## Phase 0 — Project Foundation

### Goals
- Repository structure
- Agent rules
- Requirements
- Architecture
- Database design
- Development environment

### Deliverables
- `AGENTS.md`
- `REQUIREMENTS.md`
- Architecture docs
- Docker development setup
- CI skeleton
- Backend skeleton
- Frontend skeleton

### Definition of Done
- Backend builds
- Frontend builds
- Tests execute
- Local services start
- Documentation matches repository

---

## Phase 1 — Identity

### Features
- User
- Registration
- Login
- Logout
- Session/token strategy
- Email verification foundation
- Password reset
- Authorization policies

### Security Gate
- BOLA/IDOR tests
- Password security
- Token/session security
- Rate limiting

---

## Phase 2 — Marketplace

### Features
- Categories
- Product CRUD
- Product images
- Product lifecycle
- Moderation
- Browse
- Search
- Filtering
- Sorting
- Pagination
- Favorites

### Security Gate
- Seller ownership
- Upload validation
- Input sanitization
- Rate limiting

---

## Phase 3 — Orders

### Features
- Checkout
- Order
- Order items
- Reservation
- State machine
- Cancellation rules
- Concurrency protection
- Idempotency

### Critical Gate
Prove that concurrent buyers cannot both purchase one product.

---

## Phase 4 — Payments

### Features
- Payment abstraction
- Provider integration
- Payment status
- Webhooks
- Refund foundation

### Security Gate
- Signature verification
- Duplicate webhook handling
- Replay protection
- No client-authoritative payment status

---

## Phase 5 — Delivery

### Features
- Courier profiles
- Availability
- Assignment
- Pickup
- Out-for-delivery
- Completion
- Failure
- Tracking events

### Reliability Gate
- Assignment race handling
- Idempotent state transitions
- Delivery failure recovery

---

## Phase 6 — Notifications

### Features
- In-app
- Email
- Push-ready abstraction
- Retry/dead-letter handling

---

## Phase 7 — Frontend Completion

### Screens
- Landing/home
- Browse
- Product details
- Auth
- Seller dashboard
- Create/edit listing
- Checkout
- Orders
- Tracking
- Profile
- Admin

### Quality
- Responsive
- Accessible
- RTL/LTR support
- Loading/error/empty states

---

## Phase 8 — QA

- Unit coverage
- Integration coverage
- E2E
- Concurrency
- Failure testing
- Security regression
- API contract tests

---

## Phase 9 — Security Audit

- Authentication
- Authorization
- Uploads
- Payments
- Webhooks
- Rate limiting
- Secrets
- Data exposure
- Admin controls

---

## Phase 10 — Performance

Measure before optimizing.

Evaluate:
- DB queries
- API p95/p99
- Cache
- Image delivery
- Search
- Queue latency
- Frontend performance

---

## Phase 11 — Production Readiness

- CI/CD
- Docker production image
- Secrets
- Monitoring
- Alerting
- Backups
- Restore test
- Health checks
- Migration strategy
- Rollback strategy

---

## Phase 12 — Post-MVP

Potential:
- Advanced search
- Seller analytics
- Advanced dispatch
- Recommendations
- Fraud detection
- Automated moderation
- Multiple payment providers

Do not implement post-MVP features without explicit scope approval.
