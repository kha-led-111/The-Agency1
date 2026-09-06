using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Delivery.Services;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using Xunit;

namespace TheAgency.Tests.Unit.Delivery;

public class CourierAssignmentTests
{
    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task FindBestAvailableCourierAsync_MatchesZoneAndWorkload_SelectsBestCourier()
    {
        using var context = CreateInMemoryDbContext();

        var user1 = new User { Id = Guid.NewGuid(), Email = "c1@example.com", Role = UserRole.Courier };
        var user2 = new User { Id = Guid.NewGuid(), Email = "c2@example.com", Role = UserRole.Courier };

        var courier1 = new CourierProfile
        {
            UserId = user1.Id,
            User = user1,
            DeliveryZone = "Cairo Central",
            IsAvailable = true,
            ActiveDeliveriesCount = 2,
            Rating = 4.8m
        };

        var courier2 = new CourierProfile
        {
            UserId = user2.Id,
            User = user2,
            DeliveryZone = "Cairo Central",
            IsAvailable = true,
            ActiveDeliveriesCount = 0, // Lower workload
            Rating = 4.9m
        };

        context.Users.AddRange(user1, user2);
        context.CourierProfiles.AddRange(courier1, courier2);
        await context.SaveChangesAsync();

        var service = new DefaultCourierAssignmentService(context);
        var selected = await service.FindBestAvailableCourierAsync("Cairo Central");

        selected.Should().NotBeNull();
        selected!.UserId.Should().Be(user2.Id); // Courier 2 selected due to lower active workload
    }
}
