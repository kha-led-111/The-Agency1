# ADR-003 — Offline Cash-on-Delivery (COD) & Multi-Party Commission Fee Model

**Status:** Approved  
**Date:** 2026-09-04  
**Decision Owners:** Principal Software Architect / Product Owner  
**Related Requirements:** REQUIREMENTS.md Section 6, 8 & 12  

## Context

The marketplace operates on an **Offline Cash-on-Delivery (COD)** payment model where cash is collected by the courier upon delivery. Furthermore, the platform business model relies on taking platform commissions from all three core actors (Buyer, Seller, and Courier) on completed orders, as well as charging fixed and percentage-based fees on returned items.

## Decision

We adopt an **Offline Cash-on-Delivery (COD)** payment workflow integrated with a **Multi-Party Platform Commission Engine**:

1. **Payment Model**:
   - Primary payment method is **Cash on Delivery (COD)** collected offline by couriers.
   - Payment status transitions: `PendingCOD` -> `CollectedByCourier` -> `SettledToPlatformAndSeller`.
2. **Fixed Delivery Fee & Courier Cut**:
   - Fixed Delivery Fee charged per order (default: 15.00 EGP/USD).
   - Platform retains a configurable percentage cut from the delivery fee (default: 15% platform cut, 85% courier net payout).
3. **Multi-Party Commission Split**:
   - **Buyer Platform Fee**: Percentage added to order total (default: 5% of item price).
   - **Seller Commission**: Percentage deducted from seller gross earnings (default: 10% of item price).
   - **Platform Net Revenue**: `Buyer Fee + Seller Commission + Platform Delivery Cut`.
4. **Return & Refund Fee Mechanics**:
   - Returns incur a **Fixed Return Fee** (default: 10.00 EGP/USD) plus a **Return Percentage Fee** (default: 5% of item price).
   - Refund to Buyer = `Collected Amount - Total Return Fees`.

## Rationale

- Offline COD eliminates online payment gateway dependencies and aligns with local market preference.
- Strict server-authoritative calculations (Rule 8) ensure that all fee splits, seller payouts, courier earnings, and platform commission revenues are calculated down to the cent with full accounting invariants.

## Consequences

- All order creation and checkout endpoints compute and store explicit fee breakdowns (`ItemPrice`, `DeliveryFee`, `BuyerFee`, `SellerCommission`, `CourierEarnings`, `PlatformEarnings`).
- Financial settlement reports track cash collected by couriers versus payouts owed to sellers and platform.
