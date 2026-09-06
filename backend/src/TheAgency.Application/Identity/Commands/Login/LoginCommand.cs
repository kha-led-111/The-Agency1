using MediatR;
using TheAgency.Application.Identity.Common;

namespace TheAgency.Application.Identity.Commands.Login;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<AuthenticationResult>;
