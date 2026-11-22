const crypto = require('crypto');
const { createPaymentGateway } = require('./index');
const { MockGateway } = require('./MockGateway');
const { PaystackGateway } = require('./PaystackGateway');

test('mock gateway needs explicit permission', () => {
  expect(createPaymentGateway({ PAYMENT_PROVIDER: 'mock', ALLOW_MOCK_PAYMENTS: 'true' })).toBeInstanceOf(MockGateway);
  expect(() => createPaymentGateway({ PAYMENT_PROVIDER: 'mock' })).toThrow(/disabled/i);
});
test('missing or misspelt provider is refused', () => {
  expect(() => createPaymentGateway({})).toThrow(/unknown/i);
  expect(() => createPaymentGateway({ PAYMENT_PROVIDER: 'paystak' })).toThrow(/unknown/i);
});
test('paystack needs a secret key', () => {
  expect(() => createPaymentGateway({ PAYMENT_PROVIDER: 'paystack' })).toThrow();
  expect(createPaymentGateway({ PAYMENT_PROVIDER: 'paystack', PAYSTACK_SECRET: 'sk_test_x', APP_BASE_URL: 'http://x' }))
    .toBeInstanceOf(PaystackGateway);
});

const KEY = 'sk_test_example';
const gateway = new PaystackGateway({ secretKey: KEY, appBaseUrl: 'http://localhost:5173' });
const sign = (b) => crypto.createHmac('sha512', KEY).update(b).digest('hex');
const body = JSON.stringify({
  event: 'charge.success',
  data: { reference: 'o1-abc', amount: 400000, currency: 'NGN', status: 'success', metadata: { orderId: 'o1' } },
});

test('signed charge.success becomes a success event', () => {
  expect(gateway.verifyWebhook({ 'x-paystack-signature': sign(body) }, body)).toEqual({
    valid: true,
    event: { providerRef: 'o1-abc', orderId: 'o1', status: 'success', amountMinor: 400000 },
  });
});
test('tampered body or missing signature is rejected', () => {
  expect(gateway.verifyWebhook({ 'x-paystack-signature': sign(body) }, `${body} `).valid).toBe(false);
  expect(gateway.verifyWebhook({}, body).valid).toBe(false);
});
test('createCheckout sends minor units, a unique reference and the order id', async () => {
  const http = jest.fn().mockResolvedValue({
    ok: true, json: async () => ({ status: true, data: { authorization_url: 'https://pay.test/x', reference: 'r' } }),
  });
  const g = new PaystackGateway({ secretKey: KEY, appBaseUrl: 'http://app', httpClient: http });
  const out = await g.createCheckout({ id: 'o1', totalMinor: 400000, userEmail: 'a@b.c' });
  const sent = JSON.parse(http.mock.calls[0][1].body);
  expect(sent).toMatchObject({ amount: 400000, currency: 'NGN', metadata: { orderId: 'o1' } });
  expect(sent.reference).toMatch(/^o1-/);
  expect(out.checkoutUrl).toBe('https://pay.test/x');
});
