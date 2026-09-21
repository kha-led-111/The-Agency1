using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity.Common;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext dbContext, IPasswordHasher passwordHasher, ILogger logger)
    {
        if (dbContext.Database.IsRelational())
        {
            var strategy = dbContext.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await dbContext.Database.BeginTransactionAsync();
                try
                {
                    await SeedAdminUsersAsync(dbContext, passwordHasher, logger);
                    await SeedCategoriesAsync(dbContext, logger);
                    await SeedProductsAsync(dbContext, logger);

                    await transaction.CommitAsync();
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    logger.LogError(ex, "An error occurred while seeding the database.");
                    throw;
                }
            });
        }
        else
        {
            await SeedAdminUsersAsync(dbContext, passwordHasher, logger);
            await SeedCategoriesAsync(dbContext, logger);
            await SeedProductsAsync(dbContext, logger);
        }
    }

    public static async Task PurgeTestDataAndSeedProductionAsync(ApplicationDbContext dbContext, IPasswordHasher passwordHasher, ILogger logger)
    {
        logger.LogWarning("Starting production database cleansing procedure. Purging all test transactions and listings...");

        if (dbContext.Database.IsRelational())
        {
            var strategy = dbContext.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await dbContext.Database.BeginTransactionAsync();
                try
                {
                    // Disable session replication role / FK constraints during bulk deletion in PostgreSQL
                    try
                    {
                        await dbContext.Database.ExecuteSqlRawAsync("SET session_replication_role = 'replica';");
                    }
                    catch
                    {
                        // Ignore if non-postgres (e.g. In-memory / SQLite)
                    }

                    dbContext.OrderItems.RemoveRange(dbContext.OrderItems);
                    dbContext.Orders.RemoveRange(dbContext.Orders);
                    dbContext.DeliveryTrackingEvents.RemoveRange(dbContext.DeliveryTrackingEvents);
                    dbContext.DeliveryTasks.RemoveRange(dbContext.DeliveryTasks);
                    dbContext.PaymentTransactions.RemoveRange(dbContext.PaymentTransactions);
                    dbContext.UserLedgerAccounts.RemoveRange(dbContext.UserLedgerAccounts);
                    dbContext.CourierProfiles.RemoveRange(dbContext.CourierProfiles);
                    dbContext.Favorites.RemoveRange(dbContext.Favorites);
                    dbContext.ProductImages.RemoveRange(dbContext.ProductImages);
                    dbContext.Products.RemoveRange(dbContext.Products);
                    dbContext.Notifications.RemoveRange(dbContext.Notifications);
                    dbContext.RefreshTokens.RemoveRange(dbContext.RefreshTokens);
                    dbContext.AccountTokens.RemoveRange(dbContext.AccountTokens);

                    var nonAdminUsers = await dbContext.Users.Where(u => u.Role != UserRole.Admin).ToListAsync();
                    dbContext.Users.RemoveRange(nonAdminUsers);

                    await dbContext.SaveChangesAsync();

                    try
                    {
                        await dbContext.Database.ExecuteSqlRawAsync("SET session_replication_role = 'origin';");
                    }
                    catch
                    {
                        // Ignore if non-postgres
                    }

                    await SeedAdminUsersAsync(dbContext, passwordHasher, logger);
                    await SeedCategoriesAsync(dbContext, logger);

                    await transaction.CommitAsync();
                    logger.LogInformation("Production database cleansing and essential data seeding completed successfully.");
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    logger.LogError(ex, "An error occurred during production database cleansing.");
                    throw;
                }
            });
        }
        else
        {
            dbContext.OrderItems.RemoveRange(dbContext.OrderItems);
            dbContext.Orders.RemoveRange(dbContext.Orders);
            dbContext.DeliveryTrackingEvents.RemoveRange(dbContext.DeliveryTrackingEvents);
            dbContext.DeliveryTasks.RemoveRange(dbContext.DeliveryTasks);
            dbContext.PaymentTransactions.RemoveRange(dbContext.PaymentTransactions);
            dbContext.UserLedgerAccounts.RemoveRange(dbContext.UserLedgerAccounts);
            dbContext.CourierProfiles.RemoveRange(dbContext.CourierProfiles);
            dbContext.Favorites.RemoveRange(dbContext.Favorites);
            dbContext.ProductImages.RemoveRange(dbContext.ProductImages);
            dbContext.Products.RemoveRange(dbContext.Products);
            dbContext.Notifications.RemoveRange(dbContext.Notifications);
            dbContext.RefreshTokens.RemoveRange(dbContext.RefreshTokens);
            dbContext.AccountTokens.RemoveRange(dbContext.AccountTokens);

            var nonAdminUsers = await dbContext.Users.Where(u => u.Role != UserRole.Admin).ToListAsync();
            dbContext.Users.RemoveRange(nonAdminUsers);

            await dbContext.SaveChangesAsync();

            await SeedAdminUsersAsync(dbContext, passwordHasher, logger);
            await SeedCategoriesAsync(dbContext, logger);
            logger.LogInformation("Production database cleansing and essential data seeding completed successfully.");
        }
    }

    public static async Task SeedAdminUsersAsync(ApplicationDbContext dbContext, IPasswordHasher passwordHasher, ILogger logger)
    {
        var adminEmails = new[]
        {
            (Email: "khaledgmal644@gmail.com", FirstName: "Khaled", LastName: "Gamal"),
            (Email: "alihesen1967@gmail.com", FirstName: "Ali", LastName: "Hesen")
        };

        const string defaultPassword = "Admin123!";

        var existingUsers = await dbContext.Users.AsNoTracking().ToListAsync();
        var existingUserDict = existingUsers.ToDictionary(
            u => u.NormalizedEmail ?? EmailNormalizer.Normalize(u.Email),
            u => u,
            StringComparer.OrdinalIgnoreCase);

        foreach (var (email, firstName, lastName) in adminEmails)
        {
            var normalizedEmail = EmailNormalizer.Normalize(email);

            if (!existingUserDict.TryGetValue(normalizedEmail, out var existingUser))
            {
                var newUser = new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    NormalizedEmail = normalizedEmail,
                    FirstName = firstName,
                    LastName = lastName,
                    PasswordHash = passwordHasher.HashPassword(defaultPassword),
                    Role = UserRole.Admin,
                    IsActive = true,
                    EmailVerifiedAtUtc = DateTime.UtcNow,
                    CreatedAtUtc = DateTime.UtcNow
                };

                dbContext.Users.Add(newUser);
                logger.LogInformation("Seeded admin user: {Email}", email);
            }
            else
            {
                var trackedUser = await dbContext.Users.FindAsync(existingUser.Id);
                if (trackedUser != null)
                {
                    trackedUser.Email = email;
                    trackedUser.NormalizedEmail = normalizedEmail;
                    trackedUser.Role = UserRole.Admin;
                    trackedUser.IsActive = true;
                    trackedUser.EmailVerifiedAtUtc = DateTime.UtcNow;
                    trackedUser.PasswordHash = passwordHasher.HashPassword(defaultPassword);
                    logger.LogInformation("Updated existing user to Admin: {Email}", email);
                }
            }
        }

        await dbContext.SaveChangesAsync();
    }

    public static async Task SeedCategoriesAsync(ApplicationDbContext dbContext, ILogger logger)
    {
        // Define exact 5 main categories and their specific subcategories
        var categorySchema = new List<(string Name, string Slug, string Desc, List<(string Name, string Slug, string Desc)> Subcategories)>
        {
            (
                "ملابس نسائية",
                "womens-clothing",
                "أحدث أزياء وملابس النساء",
                new List<(string, string, string)>
                {
                    ("منزلي", "womens-homewear", "بيجامات وطقم منزلي مريح"),
                    ("فساتين", "womens-dresses", "فساتين سهرة وكاجوال أنيقة"),
                    ("معاطف وجاكيتات", "womens-coats-jackets", "معاطف وجاكيتات نسائية شتوية"),
                    ("عبايات وأزياء تراثية", "abayas-traditional", "عبايات خليجية وأزياء شرقية"),
                    ("حقائب وإكسسوارات نسائية", "womens-bags-accessories", "حقائب يد وإكسسوارات نسائية"),
                    ("بنطلون نسائي", "womens-pants", "بنطلونات جينز وكاجوال نسائية")
                }
            ),
            (
                "ملابس رجالية",
                "mens-clothing",
                "تشكيلة أنيقة من الملابس الرجالية",
                new List<(string, string, string)>
                {
                    ("قمصان وتيشيرتات", "mens-shirts-tshirts", "قمصان رسمية وتيشيرتات كاجوال"),
                    ("بنطلون رجالي", "mens-pants", "بنطلونات جينز وقماش رجالية"),
                    ("معاطف وجاكيتات", "mens-coats-jackets", "جاكيتات ومعاطف شتوية رجالية"),
                    ("بدل ومناسبة", "mens-suits", "بدلات رسمية وأطقم مناسبات")
                }
            ),
            (
                "أحذية",
                "shoes",
                "أحذية كلاسيكية ورياضية لجميع الفئات",
                new List<(string, string, string)>
                {
                    ("أحذية للجري", "running-shoes", "أحذية جري وتمارين مريحة"),
                    ("أحذية تدريب", "training-shoes", "أحذية للتمارين واللياقة البدنية"),
                    ("أحذية كاجوال", "casual-shoes", "أحذية كاجوال يومية مريحة"),
                    ("أحذية كرة قدم", "football-shoes", "أحذية وأحذية ملاعب كرة القدم"),
                    ("أحذية كلاسيك", "classic-shoes", "أحذية جلدية رسمية وكلاسيكية"),
                    ("أحذية نسائية", "womens-shoes", "أحذية كعب وأحذية نسائية أنيقة")
                }
            ),
            (
                "إكسسوارات وساعات",
                "accessories-watches",
                "ساعات فاخرة، نظارات ومحافظ جلديات",
                new List<(string, string, string)>
                {
                    ("ساعات يد", "wrist-watches", "ساعات يد رجالية ونسائية فاخرة"),
                    ("نظارات شمسية", "sunglasses", "نظارات شمسية ذات جودة عالية"),
                    ("محافظ وجلديات", "wallets-leather", "محافظ وإكسسوارات جلدية طبيعية")
                }
            ),
            (
                "أطفال",
                "kids",
                "ملابس وأحذية أطفال أولاد وبنات",
                new List<(string, string, string)>
                {
                    ("ملابس أولاد", "boys-clothing", "أطقم وملابس أولاد عصرية"),
                    ("ملابس بنات", "girls-clothing", "فساتين وملابس بنات أنيقة"),
                    ("أحذية أطفال", "kids-shoes", "أحذية مريحة للأولاد والبنات")
                }
            )
        };

        var existingCategories = await dbContext.Categories.AsNoTracking().ToListAsync();
        var categoryBySlugOrName = existingCategories
            .GroupBy(c => c.Slug.ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First());

        foreach (var parentSpec in categorySchema)
        {
            Category parentCat;
            var parentKey = parentSpec.Slug.ToLowerInvariant();

            if (!categoryBySlugOrName.TryGetValue(parentKey, out parentCat!))
            {
                parentCat = new Category
                {
                    Id = Guid.NewGuid(),
                    Name = parentSpec.Name,
                    Slug = parentSpec.Slug,
                    Description = parentSpec.Desc,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                };
                dbContext.Categories.Add(parentCat);
                categoryBySlugOrName[parentKey] = parentCat;
            }
            else
            {
                var trackedParent = await dbContext.Categories.FindAsync(parentCat.Id);
                if (trackedParent != null)
                {
                    trackedParent.Name = parentSpec.Name;
                    trackedParent.Description = parentSpec.Desc;
                    trackedParent.ParentId = null;
                }
            }

            foreach (var subSpec in parentSpec.Subcategories)
            {
                var subKey = subSpec.Slug.ToLowerInvariant();
                if (!categoryBySlugOrName.TryGetValue(subKey, out var subCat))
                {
                    subCat = new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = subSpec.Name,
                        Slug = subSpec.Slug,
                        Description = subSpec.Desc,
                        ParentId = parentCat.Id,
                        IsActive = true,
                        CreatedAtUtc = DateTime.UtcNow
                    };
                    dbContext.Categories.Add(subCat);
                    categoryBySlugOrName[subKey] = subCat;
                }
                else
                {
                    var trackedSub = await dbContext.Categories.FindAsync(subCat.Id);
                    if (trackedSub != null)
                    {
                        trackedSub.Name = subSpec.Name;
                        trackedSub.Description = subSpec.Desc;
                        trackedSub.ParentId = parentCat.Id;
                    }
                }
            }
        }

        await dbContext.SaveChangesAsync();
        logger.LogInformation("Successfully updated Arabic categories and subcategories schema.");
    }

    public static async Task SeedProductsAsync(ApplicationDbContext dbContext, ILogger logger)
    {
        // Only seed products if the table is completely empty
        if (await dbContext.Products.AnyAsync())
        {
            logger.LogInformation("Products table already has data. Skipping product seeding.");
            return;
        }

        var seller = await dbContext.Users.AsNoTracking().FirstOrDefaultAsync();
        if (seller is null)
        {
            logger.LogWarning("No user found to assign as product seller. Skipping product seeding.");
            return;
        }

        // Retrieve valid subcategories or main categories to map sample products
        var subCategories = await dbContext.Categories.AsNoTracking().Where(c => c.ParentId != null).ToListAsync();
        if (!subCategories.Any())
        {
            logger.LogWarning("No categories available to attach products. Skipping product seeding.");
            return;
        }

        Guid GetCatId(string slug) => subCategories.FirstOrDefault(c => c.Slug == slug)?.Id ?? subCategories.First().Id;

        var sampleProducts = new List<Product>
        {
            new Product
            {
                Id = Guid.NewGuid(),
                SellerId = seller.Id,
                CategoryId = GetCatId("womens-coats-jackets"),
                Title = "معطف صوف كلاسيكي نسائي",
                Slug = "classic-womens-wool-coat",
                Description = "معطف صوف أنيق بتصميم راقي ومريح، مناسب لفصل الشتاء واللقاءات الرسمية.",
                Price = 350.00m,
                Condition = ProductCondition.LikeNew,
                Status = ProductStatus.Published,
                ImageUrl = "https://images.unsplash.com/photo-1539533018447-63fcce2678e3",
                IsApproved = true,
                CreatedAtUtc = DateTime.UtcNow
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SellerId = seller.Id,
                CategoryId = GetCatId("mens-shirts-tshirts"),
                Title = "قميص رجالي قطن أبيض",
                Slug = "mens-white-cotton-shirt",
                Description = "قميص قطني 100% بتصميم كلاسيكي مريح مناسب للإطلالات الرسمية والعمل.",
                Price = 180.00m,
                Condition = ProductCondition.New,
                Status = ProductStatus.Published,
                ImageUrl = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
                IsApproved = true,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-2)
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SellerId = seller.Id,
                CategoryId = GetCatId("running-shoes"),
                Title = "حذاء جري خفيف ورياضي",
                Slug = "lightweight-running-shoes",
                Description = "حذاء مخصص للجري وتمارين اللياقة البدنية ونعل مرن ممتص للصدمات.",
                Price = 240.00m,
                Condition = ProductCondition.Excellent,
                Status = ProductStatus.Published,
                ImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
                IsApproved = true,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-5)
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SellerId = seller.Id,
                CategoryId = GetCatId("wrist-watches"),
                Title = "ساعة يد جلدية كلاسيكية",
                Slug = "classic-leather-wrist-watch",
                Description = "ساعة يد كلاسيكية بسوار من الجلد الطبيعي وهيكل مقاوم للماء.",
                Price = 420.00m,
                Condition = ProductCondition.New,
                Status = ProductStatus.Published,
                ImageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
                IsApproved = true,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-10)
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SellerId = seller.Id,
                CategoryId = GetCatId("boys-clothing"),
                Title = "طقم قطني صيفي للأطفال",
                Slug = "kids-cotton-summer-set",
                Description = "طقم قطني ناعم جداً ومريح للعب والحركة اليومية للأطفال.",
                Price = 110.00m,
                Condition = ProductCondition.New,
                Status = ProductStatus.Published,
                ImageUrl = "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea",
                IsApproved = true,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-12)
            }
        };

        dbContext.Products.AddRange(sampleProducts);
        await dbContext.SaveChangesAsync();
        logger.LogInformation("Successfully seeded {Count} sample products into PostgreSQL.", sampleProducts.Count);
    }
}