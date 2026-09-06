using System;

namespace TheAgency.Domain.Entities;

public class Favorite
{
    public Guid UserId { get; set; }
    public Guid ProductId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = default!;
    public Product Product { get; set; } = default!;
}
