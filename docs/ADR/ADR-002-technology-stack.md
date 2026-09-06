# ADR-002 — Standard Technology Stack Defaults

**Status:** Approved  
**Date:** 2026-09-02  
**Decision Owners:** Principal Software Architect, Dev Lead  
**Related Requirements:** REQUIREMENTS.md Section 1 & 2  

## Context

To ensure team alignment, consistent tooling, high runtime efficiency, and maintainability across backend and frontend codebases, explicit default technologies must be defined and enforced.

## Decision

We adopt the following baseline technology defaults across **The Agency**:

### Backend Infrastructure
- **Runtime & Framework**: .NET 9 ASP.NET Core REST API
- **ORM & Database**: Entity Framework Core 9, PostgreSQL 16
- **Caching & Distributed Locks**: Redis 7
- **Message Bus**: RabbitMQ 3.x (with MassTransit 8.x abstraction)
- **Object Storage**: LocalStack S3 for local development / AWS S3 for production
- **Observability**: OpenTelemetry (tracing, metrics, health checks)

### Frontend Application
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State & Data Fetching**: TanStack Query (React Query)
- **Forms & Validation**: React Hook Form, Zod

## Alternatives Considered

### Alternative Frameworks (e.g. Node Express / Python FastAPI)
Pros:
- Dynamic typing flexibility.

Cons:
- Lower performance for concurrent transaction locking, lack of strongly typed domain contracts compared to C# .NET 9.

## Rationale

This tech stack combines high transactional performance (.NET 9 + PostgreSQL + EF Core) with modern, responsive user interface standards (Next.js 15 + Tailwind + TanStack Query).

## Security Impact

Strong type checking, built-in CSRF/XSS protection in Next.js, parameterized queries in EF Core, and centralized JWT security in ASP.NET Core.

## Performance Impact

High throughput for REST APIs, low latency in-memory caching with Redis, and async messaging with RabbitMQ.

## Operational Impact

Standardized container configuration via Docker Compose for dev environment and GitHub Actions CI.

## Consequences

Positive:
- Strongly typed ecosystem across API, application, and UI schema validation.
- Standardized architectural defaults prevent technology sprawl.

Negative:
- Requires team adherence to technology defaults.

## Follow-up

Finalize payment provider integration design in Phase 4.
