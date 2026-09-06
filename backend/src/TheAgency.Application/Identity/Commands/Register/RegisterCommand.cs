using MediatR;
using TheAgency.Application.Identity.Common;

namespace TheAgency.Application.Identity.Commands.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string PhoneNumber
) : IRequest<AuthenticationResult>;
