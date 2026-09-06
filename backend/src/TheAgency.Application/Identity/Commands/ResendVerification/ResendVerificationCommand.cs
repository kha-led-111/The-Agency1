using MediatR;

namespace TheAgency.Application.Identity.Commands.ResendVerification;

public record ResendVerificationCommand(string Email) : IRequest;
