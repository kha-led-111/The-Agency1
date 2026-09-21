using System;
using System.Collections.Generic;
using TheAgency.Domain.Enums;

namespace TheAgency.Domain.Entities;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OrderNumber { get; set; } = string.Empty;
    public Guid BuyerId { get; set; }

    // Multi-party Commission Financial Breakdown
    public decimal ItemPrice { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal BuyerFee { get; set; }
    public decimal SellerCommission { get; set; }
    public decimal CourierEarnings { get; set; }
    public decimal PlatformEarnings { get; set; }
    public decimal TotalAmount { get; set; }

    // Return & Refund Breakdown
    public decimal ReturnFee { get; set; }
    public decimal ReturnPercentageFee { get; set; }

    public string ShippingAddress { get; set; } = string.Empty;
    public OrderStatus Status { get; set; } = OrderStatus.PendingPayment;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CashOnDelivery;
    public string? IdempotencyKey { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public Guid? DeliveryAgentId { get; set; }
    public User Buyer { get; set; } = default!;
    public User? DeliveryAgent { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
