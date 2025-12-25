# Payment Methods Setup Guide

This guide explains how to set up and configure PayU and Cash on Delivery payment methods for your MedusaJS e-commerce store.

---

## Overview

Your store supports the following payment methods:

- **PayU**: A popular payment gateway supporting credit cards, debit cards, UPI, net banking, and mobile wallets (primarily for India)
- **Cash on Delivery (COD)**: Customers pay in cash when their order is delivered

---

## ⚠️ Important Note: MedusaJS v2 Custom Payment Provider Bug

**There is a known bug in MedusaJS v2.x that prevents custom payment providers in `src/modules` from being loaded properly.**

- **GitHub Issue**: [medusajs/medusa#9416](https://github.com/medusajs/medusa/issues/9416)
- **Status**: Open (as of December 2024)
- **Error**: Custom payment providers in `src/modules` fail to load with "MODULE_NOT_FOUND" errors

### Current Implementation Status

The PayU payment provider code has been implemented at:
- `backend/src/modules/payment-payu/` - Complete PayU provider implementation
- `frontend/src/lib/constants.tsx` - PayU added to payment methods
- `frontend/src/modules/checkout/components/payment-button/` - PayU payment button component

**However**, the PayU provider cannot be activated due to this framework bug.

### Workaround Options

1. **Wait for MedusaJS fix**: Monitor GitHub issue #9416 for a resolution
2. **Use published package**: Convert the provider to a published npm package (recommended for production)
3. **Use existing providers**: Consider using Stripe (built-in) which is already supported in MedusaJS v2

---

## PayU Setup

### 1. Create a PayU Merchant Account

To use PayU, you need a merchant account. Follow these steps:

1. Visit the PayU India website: https://payu.in/
2. Click on "Sign Up" or "Register" to create a new merchant account
3. Fill in the required business information:
   - Business name and type
   - Business address and contact details
   - Bank account details for settlements
   - PAN card and GST information (for India)
4. Submit the application and wait for approval

### 2. Get Your Test Credentials

Once your account is created, you can access test credentials for integration testing:

1. Log in to your PayU Dashboard
2. Look for a toggle or menu option to switch between "Live" and "Test" mode
3. In Test mode, navigate to:
   - **Settings** > **Developer** or
   - **Integration** > **API Settings**
4. You will find:
   - **Merchant Key** (also called `key` or `merchantKey`)
   - **Merchant Salt** (also called `salt` or `merchantSalt`)

### 3. Configure Environment Variables

Add the following environment variables to your backend `.env` file:

```bash
# PayU Payment Gateway Configuration
PAYU_MERCHANT_KEY=your_test_merchant_key_here
PAYU_MERCHANT_SALT=your_test_merchant_salt_here
PAYU_ENVIRONMENT=test
```

**For Production:**
```bash
PAYU_MERCHANT_KEY=your_live_merchant_key_here
PAYU_MERCHANT_SALT=your_live_merchant_salt_here
PAYU_ENVIRONMENT=production
```

**Optional (for webhook verification):**
```bash
PAYU_WEBHOOK_SECRET=your_webhook_secret_here
```

### 4. Configure Store URL

Make sure your `STORE_URL` environment variable is set correctly in your backend `.env` file. PayU uses this to redirect customers after payment:

```bash
STORE_URL=https://yourstore.com
```

For local development:
```bash
STORE_URL=http://localhost:3000
```

### 5. Enable PayU in Your Region

After the backend is configured with PayU credentials:

1. Log in to your Medusa Admin panel
2. Navigate to **Settings** > **Regions**
3. Select the region where you want to enable PayU
4. Find the "Payment Providers" section
5. Add **PayU** (`pp_payu_payu`) to the enabled payment providers
6. Save your changes

### 6. Test PayU Integration

To test PayU in test mode:

1. Add items to your cart and proceed to checkout
2. Select "PayU" as the payment method
3. Click "Pay with PayU"
4. You should be redirected to the PayU test checkout page
5. Use PayU's test card details to complete a test payment:
   - Card Number: `5123456789012346` (example test card)
   - Expiry: Any future date
   - CVV: Any 3 digits
   - Name: Any name
6. Complete the payment and verify you are redirected back to your store's order confirmation page

---

## Cash on Delivery (COD) Setup

Cash on Delivery is already built into MedusaJS. To enable it:

1. Log in to your Medusa Admin panel
2. Navigate to **Settings** > **Regions**
3. Select the region where you want to enable COD
4. Find the "Payment Providers" section
5. Add **Cash on Delivery** (`pp_system_default`) to the enabled payment providers
6. Save your changes

### COD Considerations

- COD is typically only available for domestic orders within your country
- You may want to set a maximum order value for COD (e.g., orders above a certain amount require prepayment)
- Consider the delivery areas where COD is practical
- Make sure your delivery partners support COD payments

---

## Testing Checklist

### PayU Testing

- [ ] Test successful payment with a test card
- [ ] Test failed payment scenarios (insufficient funds, declined card)
- [ ] Verify order is created after successful payment
- [ ] Verify order status is correct
- [ ] Test payment cancellation flow
- [ ] Verify webhook processing (if configured)

### COD Testing

- [ ] Place an order with COD as payment method
- [ ] Verify order is created with "requires capture" status
- [ ] Test order fulfillment workflow
- [ ] Verify customer sees correct payment method on order confirmation

---

## Production Go-Live Checklist

Before switching PayU to production:

1. **Update Credentials**: Replace test credentials with live credentials in `.env` file
2. **Set Environment**: Change `PAYU_ENVIRONMENT` from `test` to `production`
3. **Verify URLs**: Ensure `STORE_URL` points to your production domain
4. **Test Payment Flow**: Do at least one real test transaction (with a small amount)
5. **Configure Webhooks**: Set up webhooks in PayU dashboard for real-time payment updates
6. **Monitor Dashboard**: Keep an eye on PayU dashboard for any transaction issues
7. **Settlements**: Configure your bank account for automatic settlements

---

## Troubleshooting

### MedusaJS v2 Custom Payment Provider Bug

**Error when starting backend:**
```
Could not resolve module: Payment. Error: Errors while loading module providers for module payment:
Cannot find module '...node_modules/@medusajs/medusa/dist/modules/dist/payment.js'
```

**Cause**: This is the known bug in MedusaJS v2 (GitHub issue #9416). The framework cannot load custom payment providers from `src/modules` directories.

**Solution**: See the "Workaround Options" section above. The provider code is correct but cannot be loaded until this framework bug is fixed.

### PayU Issues

**Payment URL not generated:**
- Verify `PAYU_MERCHANT_KEY` and `PAYU_MERCHANT_SALT` are set correctly
- Check backend logs for any error messages
- Ensure PayU module is properly registered in `medusa-config.ts`

**Redirect not working after payment:**
- Verify `STORE_URL` environment variable is set correctly
- Check PayU dashboard for success/failure URL settings
- Ensure your order confirmation page route is correct

**Webhook not processing:**
- Verify `PAYU_WEBHOOK_SECRET` is set (if using webhook verification)
- Check PayU dashboard webhook configuration
- Ensure webhook endpoint is publicly accessible

**Payment status not updating:**
- Check if webhook is being received by your server
- Verify webhook hash validation is working
- Check Medusa payment logs

### COD Issues

**COD not showing as payment option:**
- Verify `pp_system_default` is enabled in the region settings
- Check frontend `constants.tsx` has the COD entry in `paymentInfoMap`

**Order not completing with COD:**
- Ensure payment button component handles `isManual()` provider correctly
- Check that `placeOrder` function is being called

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PAYU_MERCHANT_KEY` | Yes | Your PayU merchant key | `gtKFFx` |
| `PAYU_MERCHANT_SALT` | Yes | Your PayU merchant salt | `ehG3g345` |
| `PAYU_ENVIRONMENT` | Yes | Test or production mode | `test` or `production` |
| `PAYU_WEBHOOK_SECRET` | Optional | Secret for webhook verification | `your_secret` |
| `STORE_URL` | Yes | Your store URL for redirects | `https://store.example.com` |

---

## Support Resources

- **PayU India Documentation**: https://docs.payu.in/
- **PayU Dashboard**: https://payu.in/
- **MedusaJS Documentation**: https://docs.medusajs.com/

---

## Summary

1. **PayU** requires a merchant account and credentials configuration
2. **COD** is built-in and only needs to be enabled in region settings
3. Both payment methods are configured in the Medusa Admin panel under region settings
4. Test thoroughly in test mode before going live
