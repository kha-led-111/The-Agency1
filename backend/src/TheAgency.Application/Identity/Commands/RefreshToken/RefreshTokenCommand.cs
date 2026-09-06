using MediatR;
using TheAgency.Application.Identity.Common;

namespace TheAgency.Application.Identity.Commands.RefreshToken;

public record RefreshTokenCommand(
    string RefreshToken
) : IRequest<AuthenticationResult>;
