using FluentValidation;
using TheAgency.Domain.Constants;

namespace TheAgency.Application.Orders.Commands.CreateOrder;

public sealed class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.BuyerId).NotEmpty();
        RuleFor(x => x.ProductIds).NotEmpty().WithMessage("At least one product must be selected for checkout.");
        RuleFor(x => x.ShippingAddress)
            .NotEmpty()
            .Length(5, 500);

        RuleFor(x => x)
            .Must(x => AllowedCities.IsLocationAllowed(x.Governorate, x.City, x.ShippingAddress))
            .WithMessage(AllowedCities.UnsupportedErrorMessage);
    }
}

