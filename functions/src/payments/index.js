// Payment gateway factory (Factory pattern): chooses the real or mock gateway from configuration.

const { MockGateway } = require('./MockGateway');
const { PaystackGateway } = require('./PaystackGateway');

/** Factory. No silent fallback: a misconfigured provider fails loudly. */
function createPaymentGateway(config) {
  switch (config.PAYMENT_PROVIDER) {
    case 'paystack':
      return new PaystackGateway({ secretKey: config.PAYSTACK_SECRET, appBaseUrl: config.APP_BASE_URL });
    case 'mock':
      if (config.ALLOW_MOCK_PAYMENTS !== 'true') throw new Error('Mock payments are disabled.');
      return new MockGateway();
    default:
      throw new Error(`Unknown payment provider: ${config.PAYMENT_PROVIDER}`);
  }
}

module.exports = { createPaymentGateway };
