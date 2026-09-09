using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAdminUsersAsync(ApplicationDbContext dbContext, IPasswordHasher passwordHasher, ILogger logger)
    {
        var adminEmails = new[]
        {
            (Email: "khaledgmal644@gmail.com", FirstName: "Khaled", LastName: "Gamal"),
            (Email: "alihesen1967@gmail.com", FirstName: "Ali", LastName: "Hesen")
        };

        const string password = "weka556677@#$";

        foreach (var (email, firstName, lastName) in adminEmails)
        {
            var normalizedEmail = email.ToUpperInvariant();
            var existingUser = await dbContext.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail);

            if (existingUser == null)
            {
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    NormalizedEmail = normalizedEmail,
                    FirstName = firstName,
                    LastName = lastName,
                    PasswordHash = passwordHasher.HashPassword(password),
                    Role = UserRole.Admin,
                    CreatedAtUtc = DateTime.UtcNow
                };

                dbContext.Users.Add(user);
                logger.LogInformation("Seeded admin user: {Email}", email);
            }
            else
            {
                existingUser.Role = UserRole.Admin;
                existingUser.PasswordHash = passwordHasher.HashPassword(password);
                logger.LogInformation("Updated existing user to Admin: {Email}", email);
            }
        }

        await dbContext.SaveChangesAsync();
    }
}
