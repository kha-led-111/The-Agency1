using System;
using MediatR;

namespace TheAgency.Application.Marketplace.Commands.DeleteProduct;

public sealed record DeleteProductCommand(Guid ProductId, Guid RequestUserId) : IRequest<bool>;
