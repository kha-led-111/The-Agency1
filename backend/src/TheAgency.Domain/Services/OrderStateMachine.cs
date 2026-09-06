using System;
using TheAgency.Domain.Enums;

namespace TheAgency.Domain.Services;

public static class OrderStateMachine
{
    public static bool IsValidTransition(OrderStatus current, OrderStatus target)
    {
        if (current == target)
            return true;

        return (current, target) switch
        {
            // Payment & Initial flow
            (OrderStatus.PendingPayment, OrderStatus.Paid) => true,
            (OrderStatus.PendingPayment, OrderStatus.Cancelled) => true,

            // Seller Processing
            (OrderStatus.Paid, OrderStatus.Processing) => true,
            (OrderStatus.Paid, OrderStatus.Cancelled) => true,

            // Dispatch & Courier
            (OrderStatus.Processing, OrderStatus.OutForDelivery) => true,
            (OrderStatus.Processing, OrderStatus.Cancelled) => true,

            (OrderStatus.OutForDelivery, OrderStatus.Delivered) => true,
            (OrderStatus.OutForDelivery, OrderStatus.FailedDelivery) => true,

            (OrderStatus.FailedDelivery, OrderStatus.OutForDelivery) => true,
            (OrderStatus.FailedDelivery, OrderStatus.Cancelled) => true,
            (OrderStatus.FailedDelivery, OrderStatus.Returned) => true,

            // Returns
            (OrderStatus.Delivered, OrderStatus.ReturnRequested) => true,
            (OrderStatus.ReturnRequested, OrderStatus.Returned) => true,
            (OrderStatus.ReturnRequested, OrderStatus.Delivered) => true, // Return rejected

            // Terminal states
            (OrderStatus.Cancelled, _) => false,
            (OrderStatus.Returned, _) => false,

            _ => false
        };
    }

    public static bool CanUserTransitionOrder(OrderStatus current, OrderStatus target, UserRole role, bool isBuyer, bool isSeller)
    {
        if (!IsValidTransition(current, target))
            return false;

        // Admin can trigger any structurally valid transition
        if (role == UserRole.Admin)
            return true;

        return (current, target) switch
        {
            // Buyer can cancel when pending/paid, or request return when delivered
            (OrderStatus.PendingPayment, OrderStatus.Cancelled) when isBuyer => true,
            (OrderStatus.Paid, OrderStatus.Cancelled) when isBuyer => true,
            (OrderStatus.Delivered, OrderStatus.ReturnRequested) when isBuyer => true,

            // Seller can mark processing (ready for courier), cancel paid order, or process return request
            (OrderStatus.Paid, OrderStatus.Processing) when isSeller => true,
            (OrderStatus.Paid, OrderStatus.Cancelled) when isSeller => true,
            (OrderStatus.Processing, OrderStatus.Cancelled) when isSeller => true,
            (OrderStatus.ReturnRequested, OrderStatus.Returned) when isSeller => true,
            (OrderStatus.ReturnRequested, OrderStatus.Delivered) when isSeller => true,

            // Courier can update delivery status transitions
            (OrderStatus.Processing, OrderStatus.OutForDelivery) when role == UserRole.Courier => true,
            (OrderStatus.OutForDelivery, OrderStatus.Delivered) when role == UserRole.Courier => true,
            (OrderStatus.OutForDelivery, OrderStatus.FailedDelivery) when role == UserRole.Courier => true,
            (OrderStatus.FailedDelivery, OrderStatus.OutForDelivery) when role == UserRole.Courier => true,
            (OrderStatus.FailedDelivery, OrderStatus.Returned) when role == UserRole.Courier => true,

            // Payment processor / system
            (OrderStatus.PendingPayment, OrderStatus.Paid) => true,

            _ => false
        };
    }

    public static void ValidateTransition(OrderStatus current, OrderStatus target, UserRole role, bool isBuyer, bool isSeller)
    {
        if (!IsValidTransition(current, target))
        {
            throw new InvalidOperationException($"Invalid order status transition from '{current}' to '{target}'.");
        }

        if (!CanUserTransitionOrder(current, target, role, isBuyer, isSeller))
        {
            throw new UnauthorizedAccessException($"User with role '{role}' is not authorized to transition order status from '{current}' to '{target}'.");
        }
    }
}
