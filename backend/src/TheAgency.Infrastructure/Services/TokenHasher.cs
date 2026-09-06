using System.Security.Cryptography;
using TheAgency.Application.Common.Interfaces;

namespace TheAgency.Infrastructure.Services;

public sealed class TokenHasher : ITokenHasher
{
    public string CreatePlaintextToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    }

    public string Hash(string plaintextToken)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(plaintextToken));
        return Convert.ToHexString(bytes);
    }
}
