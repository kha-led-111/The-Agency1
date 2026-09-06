using FluentValidation;

namespace TheAgency.Application.Marketplace.Commands.CreateProduct;

public sealed class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.SellerId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().Length(3, 120);
        RuleFor(x => x.Description).NotEmpty().Length(20, 2000);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.Condition)
            .Must(value => value is not null && (value.Equals("New", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("LikeNew", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Excellent", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("VeryGood", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Good", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Fair", System.StringComparison.OrdinalIgnoreCase)))
            .WithMessage("Condition must be a valid marketplace condition.");
    }
}
