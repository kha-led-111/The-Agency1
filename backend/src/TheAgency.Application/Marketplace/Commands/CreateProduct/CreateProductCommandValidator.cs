using FluentValidation;
using TheAgency.Domain.Constants;
using TheAgency.Domain.Services;

namespace TheAgency.Application.Marketplace.Commands.CreateProduct;

public sealed class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.SellerId).NotEmpty();
        RuleFor(x => x.Title)
            .NotEmpty().Length(3, 120)
            .Must(text => string.IsNullOrWhiteSpace(text) || !ContactInfoDetector.ContainsContactInfo(text))
            .WithMessage("يُمنع كتابة أرقام الهواتف أو الروابط الخارجية لضمان أمان المعاملات.");

        RuleFor(x => x.Description)
            .NotEmpty().Length(20, 2000)
            .Must(text => string.IsNullOrWhiteSpace(text) || !ContactInfoDetector.ContainsContactInfo(text))
            .WithMessage("يُمنع كتابة أرقام الهواتف أو الروابط الخارجية لضمان أمان المعاملات.");
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.ImageUrl)
            .NotEmpty()
            .WithMessage("يرجى رفع صورتين حقيقيتين على الأقل للقطعة المعروضة.");
        RuleFor(x => x.Condition)
            .Must(value => value is not null && (value.Equals("New", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("LikeNew", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Excellent", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("VeryGood", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Good", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Fair", System.StringComparison.OrdinalIgnoreCase)))
            .WithMessage("Condition must be a valid marketplace condition.");

        RuleFor(x => x)
            .Must(x => AllowedCities.IsLocationAllowed(x.Governorate, x.City, x.Location))
            .WithMessage(AllowedCities.UnsupportedErrorMessage);

        When(x => !string.IsNullOrWhiteSpace(x.Location), () =>
        {
            RuleFor(x => x.Location!)
                .Must(AllowedCities.IsCityAllowed)
                .WithMessage(AllowedCities.UnsupportedErrorMessage);
        });
    }
}

