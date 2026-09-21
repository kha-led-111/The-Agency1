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

    [Theory]
    [InlineData("الغربية", "المحلة الكبرى")]
    [InlineData("الغربية", "طنطا")]
    [InlineData("المنوفية", "شبين الكوم")]
    [InlineData("الدقهلية", "المنصورة")]
    public void IsLocationAllowed_ValidGovernorateAndCity_ShouldReturnTrue(string governorate, string city)
    {
        var result = AllowedCities.IsLocationAllowed(governorate, city);
        result.Should().BeTrue();
    }

    [Theory]
    [InlineData("القاهرة", "المعادي")]
    [InlineData("الجيزة", "طنطا")] // Mismatched governorate
    [InlineData("الغربية", "المنصورة")] // City belongs to Dakahlia, not Gharbia
    [InlineData("الإسكندرية", "سموحة")]
    public void IsLocationAllowed_InvalidGovernorateOrCity_ShouldReturnFalse(string governorate, string city)
    {
        var result = AllowedCities.IsLocationAllowed(governorate, city);
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
        result.Errors.Should().Contain(e => e.ErrorMessage == AllowedCities.UnsupportedErrorMessage);
    }

    [Fact]
    public void CreateOrderCommandValidator_ValidCity_ShouldPassCityValidation()
    {
        // Arrange
        var validator = new CreateOrderCommandValidator();
        var command = new CreateOrderCommand(
            BuyerId: Guid.NewGuid(),
            ProductIds: new[] { Guid.NewGuid() },
            ShippingAddress: "شارع البحر، المحلة الكبرى",
            Governorate: "الغربية",
            City: "المحلة الكبرى"
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
            Location: "القاهرة - المعادي",
            Governorate: "القاهرة",
            City: "المعادي"
        );

        // Act
        var result = validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == AllowedCities.UnsupportedErrorMessage);
    }
}
