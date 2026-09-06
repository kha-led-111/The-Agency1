using FluentValidation;

namespace TheAgency.Application.Orders.Commands.UpdateOrderStatus;

public sealed class UpdateOrderStatusCommandValidator : AbstractValidator<UpdateOrderStatusCommand>
{
    public UpdateOrderStatusCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("OrderId is required.");

        RuleFor(x => x.RequestUserId)
            .NotEmpty().WithMessage("RequestUserId is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum().WithMessage("A valid OrderStatus must be provided.");
    }
}
