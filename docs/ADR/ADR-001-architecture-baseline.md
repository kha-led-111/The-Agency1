# ADR-001 — Modular Monolith Architecture Baseline

**Status:** Approved  
**Date:** 2026-09-02  
**Decision Owners:** Principal Software Architect  
**Related Requirements:** REQUIREMENTS.md Section 1 & 2  

## Context

The Agency is a multi-vendor marketplace connecting buyers, sellers, and couriers with high requirements for data consistency, security, transactional integrity, and maintainability. We need an architectural foundation that supports clean boundary separation without unnecessary operational complexity at launch.

## Decision

We adopt a **Modular Monolith** architecture structure adhering to **Clean Architecture** principles and **Domain-Driven Design (DDD)** boundaries:
1. **Domain Layer (`TheAgency.Domain`)**: Core business entities, value objects, domain events, and domain rules without external dependencies.
2. **Application Layer (`TheAgency.Application`)**: Use cases, command/query handlers (CQRS via MediatR), validation (FluentValidation), and interfaces.
3. **Infrastructure Layer (`TheAgency.Infrastructure`)**: Persistence (EF Core, PostgreSQL), messaging (RabbitMQ via MassTransit), caching (Redis), object storage (S3/LocalStack), and external integration adapters.
4. **API Layer (`TheAgency.API`)**: ASP.NET Core REST API controllers, OpenAPI documentation, security middleware, and health endpoints.

## Alternatives Considered

### Option A: Microservices Architecture from Day 1
Pros:
- Independent scaling of services.

Cons:
- High operational overhead, distributed transaction complexity (Saga management), networking overhead, and slow iteration.

### Option B: Layered Monolith (Traditional N-Tier)
Pros:
- Low complexity.

Cons:
- High risk of tight coupling across domains over time, making future extraction difficult.

## Rationale

The Modular Monolith provides clean boundaries and high maintainability while running within a unified deployment process. Each module maintains isolated domain boundaries, allowing seamless extraction into dedicated microservices later if scaling demands require it.

## Security Impact

Centralized authentication, policy-based authorization, and input validation across clean boundaries.

## Performance Impact

Low latency due to in-process calls between application modules while retaining async event integration via RabbitMQ.

## Operational Impact

Single deployment unit for backend container, simplifying CI/CD, local development, and monitoring.

## Migration Impact

None (Initial system baseline).

## Consequences

Positive:
- Faster initial development velocity.
- Strongly enforced transactional consistency for purchases.
- Standardized Clean Architecture patterns.

Negative:
- All modules share container resources until extracted.

## Follow-up

Revisit modular boundaries during Phase 3 (Orders) and Phase 5 (Delivery).
