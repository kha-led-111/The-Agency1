using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Infrastructure.Persistence;

namespace TheAgency.Tests.Integration;

public sealed class AgencyWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = Guid.NewGuid().ToString();
    public CapturingEmailSender Emails { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Messaging:Enabled"] = "false",
                ["JWT_SECRET"] = "dev_only_change_me_super_secret_key_32c",
                ["JWT_ISSUER"] = "TheAgency",
                ["JWT_AUDIENCE"] = "TheAgency",
                ["Identity:ReturnEmailTokensInResponses"] = "true",
                ["Identity:AuthRateLimitPermit"] = "1000",
                ["Cors:AllowedOrigins:0"] = "http://localhost:3000"
            });
        });

        builder.ConfigureLogging(logging => logging.ClearProviders());

        builder.ConfigureServices(services =>
        {
            var descriptors = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>) ||
                d.ServiceType == typeof(DbContextOptions) ||
                d.ServiceType == typeof(ApplicationDbContext) ||
                d.ServiceType == typeof(IApplicationDbContext) ||
                (d.ServiceType.Namespace != null && d.ServiceType.Namespace.StartsWith("Microsoft.EntityFrameworkCore"))).ToList();

            foreach (var descriptor in descriptors)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });

            services.AddScoped<IApplicationDbContext>(provider =>
                provider.GetRequiredService<ApplicationDbContext>());

            var emailDescriptors = services.Where(d => d.ServiceType == typeof(IEmailSender)).ToList();
            foreach (var descriptor in emailDescriptors)
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<IEmailSender>(Emails);
        });
    }
}

public sealed class CapturingEmailSender : IEmailSender
{
    public List<(string To, string Purpose, string Token)> Messages { get; } = new();

    public Task SendAsync(string to, string subject, string purpose, string plaintextToken, CancellationToken cancellationToken)
    {
        Messages.Add((to, purpose, plaintextToken));
        return Task.CompletedTask;
    }
}

public static class AuthClientExtensions
{
    public static void UseBearer(this HttpClient client, string accessToken)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    }

    public static Task<HttpResponseMessage> RegisterAsync(this HttpClient client, string email)
    {
        return client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "Password123!",
            firstName = "Alice",
            lastName = "Smith",
            phoneNumber = "1112223333"
        });
    }
}
