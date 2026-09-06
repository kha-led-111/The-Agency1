using MediatR;

namespace TheAgency.Application.Identity.Commands.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest;
