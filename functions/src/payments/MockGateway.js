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

  async verifyTransaction() { return { status: 'pending' }; }
}

module.exports = { MockGateway };
