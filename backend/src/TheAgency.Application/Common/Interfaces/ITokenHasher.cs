namespace TheAgency.Application.Common.Interfaces;

public interface ITokenHasher
{
    string CreatePlaintextToken();
    string Hash(string plaintextToken);
}
