---
title: Payments
---

# Payments API

The Payments API manages payment methods and credit purchases, backed by
Stripe. Use it to add or remove cards, set a default payment method, create a
payment intent for a credit purchase, and list past purchases.

Purchased credits land on your [credit balance](/api/credits).

## Payment methods

```ts
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

// Add a payment method: creates a Stripe SetupIntent to confirm client-side
const setupIntent = await client.api.payments.addMethod({});

// List saved payment methods
const methods = await client.api.payments.listMethods();

// Set the default, or delete one
await client.api.payments.setDefaultMethod('payment-method-id');
await client.api.payments.deleteMethod('payment-method-id');
```

## Purchasing credits

```ts
// Create a PaymentIntent for a credit purchase
const intent = await client.api.payments.createPaymentIntent({
  amount: 50, // USD
});

// List past credit purchases
const purchases = await client.api.payments.listPurchases();
```

## Methods

| Method | HTTP | Path | Description |
|---|---|---|---|
| `payments.listMethods()` | GET | `/payments/methods` | List payment methods |
| `payments.addMethod(request)` | POST | `/payments/setup-intent` | Add a payment method (SetupIntent) |
| `payments.setDefaultMethod(id)` | PUT | `/payments/methods/{id}/default` | Set the default payment method |
| `payments.deleteMethod(id)` | DELETE | `/payments/methods/{id}` | Delete a payment method |
| `payments.createPaymentIntent(request)` | POST | `/payments/payment-intent` | Create a PaymentIntent |
| `payments.listPurchases()` | GET | `/payments/purchases` | List credit purchases |
