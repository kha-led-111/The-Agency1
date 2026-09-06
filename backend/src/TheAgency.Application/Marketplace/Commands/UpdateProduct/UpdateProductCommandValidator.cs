using FluentValidation;

namespace TheAgency.Application.Marketplace.Commands.UpdateProduct;

public sealed class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.SellerId).NotEmpty();
        When(x => x.Title is not null, () => RuleFor(x => x.Title!).Length(3, 120));
        When(x => x.Description is not null, () => RuleFor(x => x.Description!).Length(20, 2000));
        When(x => x.Price is not null, () => RuleFor(x => x.Price!.Value).GreaterThan(0));
        When(x => x.Condition is not null, () => RuleFor(x => x.Condition!)
            .Must(value => value is not null && (value.Equals("New", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("LikeNew", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Excellent", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("VeryGood", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Good", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Fair", System.StringComparison.OrdinalIgnoreCase)))
            .WithMessage("Condition must be a valid marketplace condition."));
        When(x => x.Status is not null, () => RuleFor(x => x.Status!)
            .Must(value => value is not null && (value.Equals("Draft", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Published", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Reserved", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Sold", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Cancelled", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Rejected", System.StringComparison.OrdinalIgnoreCase)
                || value.Equals("Removed", System.StringComparison.OrdinalIgnoreCase)))
            .WithMessage("Status must be a valid product lifecycle state."));
    }
}
