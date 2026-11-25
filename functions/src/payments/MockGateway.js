// Fake gateway for local development and tests. It has the same interface as the real
// gateway (Strategy pattern), so the rest of the code does not care which one is used.

const { PaymentGateway } = require('./PaymentGateway');

/** Development and test double. Never enabled unless ALLOW_MOCK_PAYMENTS=true. */
class MockGateway extends PaymentGateway {
  async createCheckout(order) {
    return { checkoutUrl: `/mock-pay?orderId=${order.id}`, providerRef: `mock_${order.id}` };
  }

  verifyWebhook(_headers, rawBody) {
    const body = JSON.parse(rawBody);
    return {
      valid: true,
      event: {
        providerRef: body.providerRef, orderId: body.orderId,
        status: body.status, amountMinor: body.amountMinor,
      },
    };
  }

  // The mock never confirms by itself; payment is simulated through simulateMockPayment.
  async verifyTransaction() { return { status: 'pending' }; }
}

module.exports = { MockGateway };
