using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using FluentValidation;
using MediatR;
using TheAgency.Application.Common.Behaviors;
using TheAgency.Application.Payments.Interfaces;
using TheAgency.Application.Payments.Services;

namespace TheAgency.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddValidatorsFromAssembly(assembly);
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        services.AddScoped<IPaymentProvider, OfflineCodPaymentProvider>();
        services.AddScoped<TheAgency.Application.Delivery.Services.ICourierAssignmentService, TheAgency.Application.Delivery.Services.DefaultCourierAssignmentService>();
        services.AddScoped<TheAgency.Application.Notifications.Interfaces.IEmailService, TheAgency.Application.Notifications.Services.MockEmailService>();
        services.AddScoped<TheAgency.Application.Notifications.Interfaces.INotificationService, TheAgency.Application.Notifications.Services.NotificationService>();

        return services;
    }
}
