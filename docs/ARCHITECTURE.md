# The Agency — Technical Architecture

## 1. Architecture Goal

Build a secure, maintainable, production-capable marketplace without premature distributed-system complexity.

## 2. Architectural Style

Default:

**Modular Monolith + Clean Architecture principles + Domain boundaries + REST + selective asynchronous events**

The application is deployed as a coherent backend initially, while internal modules have explicit boundaries so future extraction remains possible.

## 3. High-Level Architecture

```text
                         Internet
                            |
                       Cloudflare/CDN
                            |
                  +---------+---------+
                  |                   |
               Next.js            API Gateway/
               Frontend           ASP.NET Core
                                      |
        +-----------------------------+-----------------------------+
        |              |              |              |              |
     Identity      Marketplace      Orders        Payments       Delivery
        |              |              |              |              |
        +--------------+--------------+--------------+--------------+
                                      |
                              Application Services
                                      |
                   +------------------+------------------+
                   |                  |                  |
               PostgreSQL          Redis             RabbitMQ
                   |                  |                  |
                   +------------------+------------------+
                                      |
                               Object Storage
```

## 4. Frontend

Preferred stack:
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod

Use Server Components by default where appropriate. Use Client Components only where browser interactivity requires them.

## 5. Backend

Preferred:
- ASP.NET Core
- C#
- EF Core
- PostgreSQL
- REST/OpenAPI

Suggested layers:

```text
Presentation
Application
Domain
Infrastructure
```

## 6. Backend Modules

### Identity
Authentication, users, credentials, sessions/tokens, account status.

### Marketplace
Products, categories, images, favorites, search/filtering.

### Orders
Cart/checkout, reservations, order state machine, order items.

### Payments
Provider abstraction, payments, webhooks, refunds.

### Delivery
Courier profiles, assignment, delivery lifecycle, tracking events.

### Notifications
Notification preferences and delivery orchestration.

### Administration
Moderation, user management, category management, audit operations.

## 7. Dependency Direction

```text
Presentation → Application → Domain
Infrastructure → Application/Domain
Domain → nothing external
```

Domain must not depend on:
- EF Core
- ASP.NET
- Payment SDKs
- RabbitMQ
- Redis
- HTTP clients

Infrastructure provides implementations for abstractions defined at appropriate boundaries.

## 8. Database

PostgreSQL is the authoritative transactional database.

Redis is non-authoritative and used for caching/temporary coordination.

Object storage stores image binaries.

## 9. Messaging

RabbitMQ is used for decoupled workflows.

Candidate events:
- ProductPublished
- OrderCreated
- PaymentCompleted
- PaymentFailed
- CourierAssigned
- ProductPickedUp
- OrderDelivered

Consumers must be idempotent.

## 10. Consistency

Strong consistency:
- Ownership
- Product reservation
- Order creation
- Payment state
- Financial state

Eventual consistency:
- Search index
- Notifications
- Analytics
- Recommendations

## 11. Image Architecture

```text
Browser
  |
  | request upload
  v
API
  |
  | presigned URL
  v
Object Storage
  |
  v
Image Processing
  |
  v
CDN
  |
  v
Browser
```

## 12. Authentication

Use a mature identity implementation.

Recommended conceptual flow:

```text
Login
  ↓
Credential verification
  ↓
Short-lived authenticated session/access credential
  ↓
Refresh/re-authentication mechanism
```

For browser applications, prefer secure HttpOnly cookies for sensitive session/refresh state where appropriate.

## 13. Authorization

Use:
- Role-based access
- Policy-based authorization
- Resource-level authorization

Example:

```text
CanEditProduct(user, product)
=
Authenticated
AND product.sellerId == user.id
AND product.status allows editing
```

## 14. Order Consistency

Critical purchase flow:

```text
Validate buyer
   ↓
Begin transaction
   ↓
Lock/validate product availability
   ↓
Create reservation/order
   ↓
Update product state
   ↓
Commit
```

Payment orchestration must not create inconsistent order state.

## 15. Observability

Use:
- Structured logging
- Metrics
- Distributed tracing
- Correlation IDs

Use OpenTelemetry-compatible instrumentation.

## 16. Deployment

Initial target:

```text
Cloudflare/CDN
      |
Next.js
      |
ASP.NET Core API
      |
+-----+------+-------+
|            |       |
PostgreSQL Redis  RabbitMQ
      |
Object Storage
```

Use Docker.

Kubernetes is deferred unless justified.

## 17. Scalability Path

Phase 1:
- Modular monolith
- Vertical scaling
- Multiple API instances
- Managed PostgreSQL
- Redis
- RabbitMQ

Phase 2:
- Dedicated workers
- Search engine if required
- Read replicas where justified

Phase 3:
- Extract only demonstrably independent/high-load modules.

## 18. Architecture Constraints

Do not:
- Introduce microservices by default.
- Use Redis as the source of truth.
- Put business logic in controllers.
- Expose EF entities directly.
- Trust client totals/status.
- Add infrastructure without a requirement.
- Create abstractions without a real purpose.

## 19. Architecture Decision Requirement

Any major change to:
- Database
- Authentication
- Payment architecture
- Messaging
- Deployment topology
- Service boundaries
- Search architecture

requires an ADR.
