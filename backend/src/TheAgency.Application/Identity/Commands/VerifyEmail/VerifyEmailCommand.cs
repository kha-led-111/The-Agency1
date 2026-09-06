using MediatR;

namespace TheAgency.Application.Identity.Commands.VerifyEmail;

public record VerifyEmailCommand(string Token) : IRequest;
