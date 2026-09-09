using System;
using FluentAssertions;
using TheAgency.Application.Marketplace.Commands.CreateProduct;
using TheAgency.Application.Orders.Commands.CreateOrder;
using TheAgency.Domain.Constants;
using Xunit;

namespace TheAgency.Tests.Unit.Validation;

public class CityValidationTests
{
    [Theory]
    [InlineData("المحلة الكبرى")]
    [InlineData("المحله الكبري")]
    [InlineData("طنطا")]
    [InlineData("شبين الكوم")]
    [InlineData("المنصورة")]
    [InlineData("المنصوره")]
    [InlineData("شارع البحر، المحلة الكبرى، مصر")]
    [InlineData("حي النحاس، طنطا")]
    [InlineData("البر الشرقي، شبين الكوم")]
    [InlineData("حي الجامعة، المنصورة")]
    public void IsCityAllowed_ValidCitiesAndAddresses_ShouldReturnTrue(string addressOrCity)
    {
        // Act
        var result = AllowedCities.IsCityAllowed(addressOrCity);

        // Assert
        result.Should().BeTrue();
    }

    [Theory]
    [InlineData("القاهرة")]
    [InlineData("الإسكندرية")]
    [InlineData("أسوان")]
    [InlineData("الجيزة — التجمع الخامس")]
    [InlineData("شارع التسعين، القاهرة الجديدة")]
    [InlineData("")]
    [InlineData(null)]
    public void IsCityAllowed_InvalidCitiesAndAddresses_ShouldReturnFalse(string? addressOrCity)
    {
        // Act
        var result = AllowedCities.IsCityAllowed(addressOrCity);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void CreateOrderCommandValidator_InvalidCity_ShouldFailValidation()
    {
        // Arrange
        var validator = new CreateOrderCommandValidator();
        var command = new CreateOrderCommand(
            BuyerId: Guid.NewGuid(),
            ProductIds: new[] { Guid.NewGuid() },
            ShippingAddress: "شارع التسعين، التجمع الخامس، القاهرة"
        );

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateOrderCommand.ShippingAddress) && e.ErrorMessage.Contains("supported cities"));
    }

    [Fact]
    public void CreateOrderCommandValidator_ValidCity_ShouldPassCityValidation()
    {
        // Arrange
        var validator = new CreateOrderCommandValidator();
        var command = new CreateOrderCommand(
            BuyerId: Guid.NewGuid(),
            ProductIds: new[] { Guid.NewGuid() },
            ShippingAddress: "شارع البحر، المحلة الكبرى"
        );

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateProductCommandValidator_InvalidLocation_ShouldFailValidation()
    {
        // Arrange
        var validator = new CreateProductCommandValidator();
        var command = new CreateProductCommand(
            SellerId: Guid.NewGuid(),
            Title: "معطف صوف فاخر للبيع",
            Description: "معطف صوف راقي جداً بحالة ممتازة يناسب الجميع",
            Price: 150.00m,
            Condition: "Excellent",
            CategoryId: Guid.NewGuid(),
            ImageUrl: "https://example.com/image.jpg",
            Location: "القاهرة - المعادي"
        );

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateProductCommand.Location) && e.ErrorMessage.Contains("supported cities"));
    }
}
