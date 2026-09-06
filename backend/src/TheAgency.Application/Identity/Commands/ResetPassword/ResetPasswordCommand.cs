using MediatR;

namespace TheAgency.Application.Identity.Commands.ResetPassword;

public record ResetPasswordCommand(string Token, string NewPassword) : IRequest;
