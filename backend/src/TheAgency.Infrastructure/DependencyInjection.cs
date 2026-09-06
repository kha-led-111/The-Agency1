using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using TheAgency.Infrastructure.Services;
using MassTransit;
using OpenTelemetry.Trace;

namespace TheAgency.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<IdentitySettings>(configuration.GetSection(IdentitySettings.SectionName));

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["DB_CONNECTION_STRING"];

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
            options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        });

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<ITokenHasher, TokenHasher>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IEmailSender, LoggingEmailSender>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IImageStorageService, LocalImageStorageService>();

        var secret = JwtConfiguration.GetRequiredSecret(configuration);
        var issuer = configuration["JWT_ISSUER"] ?? configuration["JwtSettings:Issuer"] ?? "TheAgency";
        var audience = configuration["JWT_AUDIENCE"] ?? configuration["JwtSettings:Audience"] ?? "TheAgency";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                ClockSkew = TimeSpan.FromSeconds(30),
                IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secret))
            };
        });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy => policy.RequireRole(nameof(UserRole.Admin)));
            options.AddPolicy("Seller", policy => policy.RequireRole(nameof(UserRole.Seller), nameof(UserRole.Admin)));
            options.AddPolicy("Courier", policy => policy.RequireRole(nameof(UserRole.Courier), nameof(UserRole.Admin)));
            options.AddPolicy("AuthenticatedUser", policy => policy.RequireAuthenticatedUser());
        });

        var messagingEnabled = configuration.GetValue("Messaging:Enabled", true);
        if (messagingEnabled)
        {
            services.AddMassTransit(x =>
            {
                x.UsingRabbitMq((_, cfg) =>
                {
                    var host = configuration["RABBITMQ_HOST"] ?? "localhost";
                    var port = configuration["RABBITMQ_PORT"] ?? "5672";
                    var username = configuration["RABBITMQ_USERNAME"] ?? "guest";
                    var password = configuration["RABBITMQ_PASSWORD"] ?? "guest";

                    cfg.Host($"rabbitmq://{host}:{port}", h =>
                    {
                        h.Username(username);
                        h.Password(password);
                    });
                });
            });
        }
        else
        {
            services.AddMassTransit(x => x.UsingInMemory());
        }

        var healthChecksBuilder = services.AddHealthChecks();
        if (!string.IsNullOrEmpty(connectionString))
        {
            healthChecksBuilder.AddNpgSql(connectionString, name: "postgresql", tags: new[] { "db", "data" });
        }

        var redisConn = configuration.GetConnectionString("Redis") ?? configuration["REDIS_CONNECTION_STRING"];
        if (!string.IsNullOrEmpty(redisConn))
        {
            healthChecksBuilder.AddRedis(redisConn, name: "redis", tags: new[] { "cache" });
        }

        var rabbitHost = configuration["RABBITMQ_HOST"];
        if (messagingEnabled && !string.IsNullOrEmpty(rabbitHost))
        {
            var rabbitPort = int.TryParse(configuration["RABBITMQ_PORT"], out var p) ? p : 5672;
            var rabbitUser = configuration["RABBITMQ_USERNAME"] ?? "guest";
            var rabbitPass = configuration["RABBITMQ_PASSWORD"] ?? "guest";
            healthChecksBuilder.AddRabbitMQ(
                async _ => await new RabbitMQ.Client.ConnectionFactory
                {
                    HostName = rabbitHost,
                    Port = rabbitPort,
                    UserName = rabbitUser,
                    Password = rabbitPass
                }.CreateConnectionAsync(),
                name: "rabbitmq",
                tags: new[] { "messaging" });
        }

        services.AddOpenTelemetry()
            .WithTracing(tracing =>
            {
                tracing
                    .AddAspNetCoreInstrumentation()
                    .AddEntityFrameworkCoreInstrumentation();
            });

        return services;
    }
}
