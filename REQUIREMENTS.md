# The Agency — Software Requirements Specification

**Status:** Baseline  
**Version:** 1.0  
**Scope:** Initial production-capable marketplace

## 1. Product Vision

The Agency is a marketplace connecting buyers and sellers while the platform manages delivery through its courier network.

Core flow:

`Seller → Platform → Courier → Buyer`

The initial focus is second-hand products, especially clothing, while the domain model should remain extensible.

## 2. Actors

### Guest
Can browse, search, filter, view products, and register/login.

### Buyer
Can manage profile/address, browse, favorite, purchase, pay, track orders, cancel eligible orders, request returns where supported, and review completed purchases.

### Seller
Can create/manage listings, upload images, publish eligible listings, view sales/orders, prepare products for pickup, and receive notifications.

### Courier
Can manage availability, view assigned deliveries, accept eligible assignments, confirm pickup/delivery, and report failures.

### Administrator
Can manage users, products, categories, orders, couriers, reports, moderation, and operational issues.

A single user may act as buyer and seller.

## 3. Functional Requirements

### Identity
- Registration
- Login
- Logout
- Password hashing
- Refresh-token/session strategy
- Email verification
- Password reset
- Account status/lockout controls where appropriate

### User Profile
- Profile management
- Address management
- Public/private information separation

### Marketplace
- Product creation
- Product editing
- Product images
- Categories
- Conditions
- Product attributes
- Product lifecycle
- Browse
- Search
- Filter
- Sort
- Pagination
- Favorites

### Orders
- Checkout
- Order creation
- Product reservation
- Order state machine
- Cancellation where eligible
- Return/refund foundation
- Concurrency protection
- Idempotency

### Payments
- Provider abstraction
- Payment creation
- Secure server-side confirmation
- Webhooks
- Signature verification
- Duplicate/replay protection
- Refund foundation

### Delivery
- Delivery creation
- Courier profiles
- Availability
- Assignment
- Acceptance
- Pickup
- Out-for-delivery
- Completion
- Failed delivery
- Tracking events

### Notifications
- In-app
- Email
- Push-ready architecture
- Async delivery where appropriate

### Moderation
- Product approval/rejection/removal
- User/seller moderation
- Reports
- Complaints

### Reviews
- Transaction-linked reviews
- Anti-abuse controls

### Administration
- User management
- Product moderation
- Order monitoring
- Courier management
- Category management
- Audit logs
- Analytics foundation

## 4. Product Lifecycle

Minimum product states:

`DRAFT → PUBLISHED → RESERVED → SOLD`

Other states:

`CANCELLED`, `REJECTED`, `REMOVED`

Only valid transitions are permitted.

## 5. Order Lifecycle

Minimum states:

`CREATED → PAYMENT_PENDING → PAID → READY_FOR_PICKUP → COURIER_ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED`

Failure/alternate states:

`CANCELLED`, `FAILED_DELIVERY`, `RETURN_REQUESTED`, `RETURNED`

Every transition requires a valid actor, source state, target state, and business-rule validation.

## 6. Business Rules

- A user cannot modify another seller's product.
- A buyer cannot access another buyer's private order data.
- A courier cannot access unrelated deliveries.
- Payment status is never trusted from the client.
- Product price and order totals are calculated/validated server-side.
- A product cannot be successfully sold twice.
- Reservations expire according to defined policy.
- Payment webhooks are idempotent.
- Reviews must be linked to legitimate completed transactions.
- Administrative actions are audited.

## 7. Security Requirements

The platform must protect against:
- SQL injection
- XSS
- CSRF where applicable
- SSRF
- IDOR/BOLA
- Broken access control
- Brute-force attacks
- Credential stuffing
- Malicious uploads
- Privilege escalation
- Replay attacks
- Race conditions
- Payment manipulation
- Mass assignment
- Sensitive data exposure

## 8. Non-Functional Requirements

Priorities:
1. Security
2. Reliability
3. Maintainability
4. Correctness
5. Performance
6. Scalability
7. Observability
8. Testability
9. Accessibility

Initial performance target for typical API requests:

`p95 < 500 ms`

This is a measurable target, not an unconditional guarantee.

## 9. Data Rules

- PostgreSQL is authoritative for transactional state.
- Money uses decimal/exact representation, never binary floating point.
- Persist timestamps in UTC by default.
- Use foreign keys and constraints.
- Use migrations under version control.
- Do not expose ORM entities directly through public API contracts.

## 10. File Upload Rules

Product images:
- Must be validated.
- Must have configurable size/count limits.
- Should use object storage.
- Should use optimized derivatives.
- Must not rely on filename/MIME type alone.

## 11. Delivery Rules

Initial courier assignment may consider:
- Availability
- Delivery zone
- Distance
- Workload

Dispatch must remain replaceable by a future optimization engine.

## 12. MVP

### Must
- Identity
- Product listings
- Product images
- Browse/search/filter
- Orders
- Reservation/concurrency protection
- One payment provider
- Courier accounts
- Basic courier assignment
- Pickup/delivery
- Admin moderation
- Logging
- Basic metrics
- Automated tests
- Security baseline

### Should
- Favorites
- Reviews
- Email notifications
- In-app notifications
- Returns

### Could
- Push notifications
- Advanced search
- Seller analytics
- Advanced courier dispatch

### Won't Yet
- Microservices
- Kubernetes
- International shipping
- Multi-currency
- Auctions
- Crypto
- Advanced AI recommendations
- Warehouse management

## 13. Open Decisions

Before production:
- Payment provider
- Object storage provider
- Cloud/deployment provider
- Delivery zones
- Delivery pricing
- Return/refund policy
- Seller verification
- Courier onboarding
- Moderation policy
- Supported currency
- Notification providers
- Data retention
- Legal/compliance requirements

Until decided, the Agent must document assumptions rather than silently treating them as final.

## 14. Definition of Done

A requirement is complete when:
- Implemented
- Business rules enforced
- Authorization verified
- Security reviewed
- Tests added/passing
- API/docs updated
- Observability considered
- No known critical regression exists
