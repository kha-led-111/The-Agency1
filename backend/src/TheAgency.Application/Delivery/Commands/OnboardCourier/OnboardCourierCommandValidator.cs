using FluentValidation;

namespace TheAgency.Application.Delivery.Commands.OnboardCourier;

public sealed class OnboardCourierCommandValidator : AbstractValidator<OnboardCourierCommand>
{
    public OnboardCourierCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        RuleFor(x => x.VehicleType)
            .NotEmpty().WithMessage("VehicleType is required.")
            .MaximumLength(50);

        RuleFor(x => x.DeliveryZone)
            .NotEmpty().WithMessage("DeliveryZone is required.")
            .MaximumLength(100);
    }
}
