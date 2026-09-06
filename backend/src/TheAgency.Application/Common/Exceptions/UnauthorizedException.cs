using System;

namespace TheAgency.Application.Common.Exceptions;

public sealed class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message)
    {
    }
}
