using System;

namespace TheAgency.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public decimal UnitPrice { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Order Order { get; set; } = default!;
    public Product Product { get; set; } = default!;
}
