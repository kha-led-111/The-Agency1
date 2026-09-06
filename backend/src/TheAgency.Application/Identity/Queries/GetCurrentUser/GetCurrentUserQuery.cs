using MediatR;
using TheAgency.Application.Identity.Common;

namespace TheAgency.Application.Identity.Queries.GetCurrentUser;

public record GetCurrentUserQuery(Guid UserId) : IRequest<UserDto>;
