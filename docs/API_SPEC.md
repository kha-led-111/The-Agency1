# The Agency — API Specification

## 1. API Principles

- REST
- JSON
- OpenAPI
- Problem Details
- Resource-level authorization
- Pagination
- Validation
- Idempotency for retry-sensitive operations

Base path:

`/api`

Versioning should only be introduced when breaking compatibility requires it.

## 2. Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/me
```

## 3. Products

```text
GET    /api/products
POST   /api/products
GET    /api/products/{productId}
PATCH  /api/products/{productId}
DELETE /api/products/{productId}
POST   /api/products/{productId}/publish
POST   /api/products/{productId}/cancel
```

Query parameters:
- q
- category
- minPrice
- maxPrice
- condition
- size
- brand
- color
- sort
- page
- pageSize

## 4. Product Images

Preferred flow:

```text
POST /api/products/{productId}/images/upload-session
```

Returns a presigned upload target.

Then client uploads directly to object storage.

Finalize/confirm upload:

```text
POST /api/products/{productId}/images
```

## 5. Favorites

```text
GET    /api/favorites
POST   /api/favorites/{productId}
DELETE /api/favorites/{productId}
```

## 6. Categories

```text
GET /api/categories
GET /api/categories/{categoryId}
```

Admin:
```text
POST   /api/admin/categories
PATCH  /api/admin/categories/{categoryId}
DELETE /api/admin/categories/{categoryId}
```

## 7. Orders

```text
POST /api/orders
GET  /api/orders
GET  /api/orders/{orderId}
POST /api/orders/{orderId}/cancel
```

Order creation should support an idempotency key where retry duplication is possible.

## 8. Payments

```text
POST /api/payments
GET  /api/payments/{paymentId}
POST /api/payments/webhook/{provider}
```

Webhook endpoint must not use normal user authorization as its security mechanism. It must use provider-specific authenticity verification.

## 9. Deliveries

```text
GET  /api/deliveries/{deliveryId}
POST /api/deliveries/{deliveryId}/accept
POST /api/deliveries/{deliveryId}/pickup
POST /api/deliveries/{deliveryId}/out-for-delivery
POST /api/deliveries/{deliveryId}/complete
POST /api/deliveries/{deliveryId}/failed
GET  /api/deliveries/{deliveryId}/tracking
```

## 10. Courier

```text
GET   /api/courier/me
PATCH /api/courier/me/availability
GET   /api/courier/deliveries
```

## 11. Reviews

```text
POST /api/orders/{orderId}/review
GET  /api/products/{productId}/reviews
```

Only legitimate eligible transactions may create reviews.

## 12. Notifications

```text
GET   /api/notifications
PATCH /api/notifications/{notificationId}/read
PATCH /api/notifications/read-all
```

## 13. Admin

```text
GET  /api/admin/users
POST /api/admin/users/{userId}/suspend
POST /api/admin/users/{userId}/restore

GET  /api/admin/products/moderation
POST /api/admin/products/{productId}/approve
POST /api/admin/products/{productId}/reject
POST /api/admin/products/{productId}/remove

GET /api/admin/orders
GET /api/admin/couriers
GET /api/admin/audit-logs
```

## 14. Error Format

Use RFC 9457-style Problem Details where supported.

Conceptual response:

```json
{
  "type": "https://example.com/problems/validation-error",
  "title": "Validation failed",
  "status": 400,
  "detail": "One or more fields are invalid.",
  "instance": "/api/products",
  "errors": {
    "price": ["Price must be greater than zero."]
  }
}
```

Do not expose internal exception details.

## 15. Pagination

Use a consistent pagination contract.

Initial approach may be page/pageSize.

For high-volume feeds, cursor pagination may be introduced.

Never return unbounded collections.

## 16. Authorization

Every endpoint must document:
- Public/private
- Required role/policy
- Resource ownership rules

## 17. Idempotency

Recommended for:
- Order creation
- Payment creation
- Webhook processing
- Critical state transitions

The exact mechanism should be defined in implementation architecture.

## 18. API Contract Rule

Frontend and backend must not silently diverge.

Breaking API changes require:
- Documentation update
- Test updates
- Migration strategy
- ADR if architectural
