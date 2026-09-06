using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TheAgency.Application.Common.Exceptions;

namespace TheAgency.API.Middleware;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var problem = exception switch
        {
            ValidationException validationException => CreateValidationProblem(httpContext, validationException),
            InvalidOperationException invalidOpException => CreateProblem(httpContext, StatusCodes.Status400BadRequest, "Invalid Operation", invalidOpException.Message),
            ConflictException conflictException => CreateProblem(httpContext, StatusCodes.Status409Conflict, "Conflict", conflictException.Message),
            UnauthorizedException unauthorizedException => CreateProblem(httpContext, StatusCodes.Status401Unauthorized, "Unauthorized", unauthorizedException.Message),
            UnauthorizedAccessException unauthorizedAccessException => CreateProblem(httpContext, StatusCodes.Status401Unauthorized, "Unauthorized", unauthorizedAccessException.Message),
            NotFoundException notFoundException => CreateProblem(httpContext, StatusCodes.Status404NotFound, "Not Found", notFoundException.Message),
            _ => CreateUnhandled(httpContext, exception)
        };

        httpContext.Response.StatusCode = problem.Status ?? StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
        return true;
    }

    private ProblemDetails CreateUnhandled(HttpContext httpContext, Exception exception)
    {
        _logger.LogError(exception, "Unhandled exception for {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);

        return CreateProblem(
            httpContext,
            StatusCodes.Status500InternalServerError,
            "An error occurred",
            "An unexpected error occurred.");
    }

    private static ProblemDetails CreateProblem(HttpContext httpContext, int status, string title, string detail)
    {
        return new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path
        };
    }

    private static HttpValidationProblemDetails CreateValidationProblem(HttpContext httpContext, ValidationException exception)
    {
        var errors = exception.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray());

        return new HttpValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation failed",
            Detail = "One or more fields are invalid.",
            Instance = httpContext.Request.Path,
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.1"
        };
    }
}
