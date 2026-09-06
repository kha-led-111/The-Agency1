using MediatR;

namespace TheAgency.Application.Identity.Commands.Logout;

public record LogoutCommand(string RefreshToken) : IRequest;
