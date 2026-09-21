using System;
using System.Collections.Generic;

namespace TheAgency.Application.Orders.Common;

public sealed record CreateOrderRequest(
    IReadOnlyList<Guid> ProductIds,
    string ShippingAddress,
    string? IdempotencyKey = null,
    string? Governorate = null,
    string? City = null);
