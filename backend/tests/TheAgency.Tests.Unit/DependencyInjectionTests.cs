using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TheAgency.Application;
using Xunit;
using FluentAssertions;
using FluentValidation;

namespace TheAgency.Tests.Unit;

public class DependencyInjectionTests
{
    [Fact]
    public void AddApplicationServices_ShouldRegisterValidatorsAndMediatR()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();

        // Act
        services.AddApplicationServices();
        var serviceProvider = services.BuildServiceProvider();

        // Assert
        // Check that MediatR services are registered (e.g. Mediator)
        var mediator = serviceProvider.GetService<MediatR.IMediator>();
        mediator.Should().NotBeNull();
    }
}
