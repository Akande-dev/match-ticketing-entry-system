// Real payment gateway (Paystack, amounts in kobo). Only used when PAYMENT_PROVIDER=paystack.
// Not tested against the live Paystack sandbox in this project; unit tests use a fake HTTP client.

const crypto = require('crypto');
const { PaymentGateway } = require('./PaymentGateway');
const { DomainError } = require('../shared/errors');

class PaystackGateway extends PaymentGateway {
  constructor({ secretKey, appBaseUrl, httpClient = fetch, baseUrl = 'https://api.paystack.co' }) {
    super();
    if (!secretKey) throw new Error('Paystack secret key is required');
    this.secretKey = secretKey;
    this.appBaseUrl = appBaseUrl;
    this.http = httpClient;
    this.baseUrl = baseUrl;
  }

  // Asks Paystack for a payment page URL for this order.
  async createCheckout(order) {
    // A fresh reference per attempt: Paystack rejects a reused reference.
    const reference = `${order.id}-${Date.now().toString(36)}`;
    const res = await this.http(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: order.userEmail,
        amount: order.totalMinor, // minor units (kobo)
        currency: 'NGN',
        reference,
        callback_url: `${this.appBaseUrl}/checkout/${order.id}`,
        metadata: { orderId: order.id },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.status) {
      throw new DomainError('unavailable', 'The payment provider is unavailable. Please try again.');
    }
    return { checkoutUrl: json.data.authorization_url, providerRef: json.data.reference };
  }

  // Checks the HMAC-SHA512 signature in constant time, so only Paystack can confirm a payment.
  verifyWebhook(headers, rawBody) {
    const expected = crypto.createHmac('sha512', this.secretKey).update(rawBody).digest('hex');
    const given = String(headers['x-paystack-signature'] ?? '');
    const valid = given.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
    if (!valid) return { valid: false };

    const body = JSON.parse(rawBody);
    const data = body.data ?? {};
    const succeeded = body.event === 'charge.success' && data.status === 'success' && data.currency === 'NGN';
    return {
      valid: true,
      event: {
        providerRef: data.reference,
        orderId: data.metadata?.orderId,
        status: succeeded ? 'success' : 'ignored',
        amountMinor: data.amount,
      },
    };
  }

  // Asks Paystack directly about a payment; the fallback when a webhook is slow or lost.
  async verifyTransaction(reference) {
    const res = await this.http(`${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.status) {
      throw new DomainError('unavailable', 'The payment provider is unavailable. Please try again.');
    }
    const d = json.data ?? {};
    return {
      status: d.status === 'success' && d.currency === 'NGN' ? 'success' : 'pending',
      providerRef: d.reference,
      orderId: d.metadata?.orderId,
      amountMinor: d.amount,
    };
  }
}

module.exports = { PaystackGateway };
