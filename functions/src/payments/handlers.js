// Cloud Function entry points for payments: start checkout, verify a payment,
// receive the gateway webhook, and (development only) simulate a mock payment.

const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const { getFirestore } = require('firebase-admin/firestore');
const { callable } = require('../shared/callable');
const { DomainError } = require('../shared/errors');
const { requireString } = require('../shared/validation');
const { TicketSigner } = require('../tickets/TicketSigner');
const { createPaymentGateway } = require('.');
const { confirmPaymentCore } = require('./paymentService');
const { cancelOrderCore } = require('../reservations/reservationService');

// Built on demand so the signing secret is read from the environment, never hard-coded.
const signer = () => new TicketSigner(process.env.TICKET_HMAC_SECRET);

// Loads an order only if it belongs to the caller. Other people's orders look 'not found',
// so order ids cannot be probed.
async function loadOwnOrder(db, auth, orderId) {
  const snap = await db.collection('orders').doc(requireString(orderId, 'orderId', 100)).get();
  if (!snap.exists || snap.data().userId !== auth.uid) throw new DomainError('not-found', 'Order not found.');
  return { ref: snap.ref, id: snap.id, order: snap.data() };
}

// Starts payment for a Pending order whose seat hold has not expired.
exports.createCheckout = callable(null, async ({ auth, data, db }) => {
  const { ref, id, order } = await loadOwnOrder(db, auth, data.orderId);
  if (order.status !== 'Pending') throw new DomainError('failed-precondition', `Order is ${order.status}.`);
  if (order.holdExpiresAt.toMillis() < Date.now()) {
    throw new DomainError('deadline-exceeded', 'Your seat hold has expired.');
  }
  const gateway = createPaymentGateway(process.env);
  const { checkoutUrl, providerRef } = await gateway.createCheckout({
    id, totalMinor: order.totalMinor, userEmail: auth.token.email,
  });
  await ref.update({ providerRef });
  return { checkoutUrl };
}, { rateLimit: { action: 'checkout', limit: 10, windowMs: 60_000 } });

/** Fallback for a slow or lost webhook: ask the gateway directly, then confirm as the webhook would. */
exports.verifyPayment = callable(null, async ({ auth, data, db }) => {
  const { ref, id, order } = await loadOwnOrder(db, auth, data.orderId);
  if (order.status !== 'Pending' || !order.providerRef) return { status: order.status };

  const result = await createPaymentGateway(process.env).verifyTransaction(order.providerRef);
  if (result.status === 'success' && result.orderId === id) {
    await confirmPaymentCore(db, signer(), {
      orderId: id, providerRef: result.providerRef, amountMinor: result.amountMinor,
    });
  }
  return { status: (await ref.get()).data().status };
}, { rateLimit: { action: 'verify', limit: 10, windowMs: 60_000 } });

// Called by the payment provider. The signature is checked before anything in the request is trusted.
exports.paymentWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  const gateway = createPaymentGateway(process.env);
  const { valid, event } = gateway.verifyWebhook(req.headers, req.rawBody.toString('utf8'));
  if (!valid) {
    logger.warn('webhook_invalid_signature');
    return res.status(401).send('Invalid signature');
  }
  if (event.status !== 'success') return res.status(200).send('ignored');

  try {
    await confirmPaymentCore(getFirestore(), signer(), {
      orderId: event.orderId, providerRef: event.providerRef, amountMinor: event.amountMinor,
    });
    return res.status(200).send('ok');
  } catch (err) {
    // Business-rule failures will never succeed on retry; unexpected errors might.
    if (err instanceof DomainError) {
      logger.error('webhook_rejected', { orderId: event.orderId, code: err.code, message: err.message });
      return res.status(200).send('rejected'); // permanent error: retrying will not help
    }
    logger.error('webhook_failed', { orderId: event.orderId, message: err.message });
    return res.status(500).send('error'); // transient error: ask the gateway to retry
  }
});

// The mock endpoint exists ONLY when the environment explicitly turns it on.
if (process.env.ALLOW_MOCK_PAYMENTS === 'true') {
  exports.simulateMockPayment = callable(null, async ({ auth, data, db }) => {
    if (process.env.PAYMENT_PROVIDER !== 'mock') {
      throw new DomainError('permission-denied', 'Mock payments are disabled.');
    }
    const { id, order } = await loadOwnOrder(db, auth, data.orderId);
    if (data.outcome === 'failure') return cancelOrderCore(db, { uid: auth.uid, orderId: id });
    return confirmPaymentCore(db, signer(), {
      orderId: id, providerRef: `mock_${id}`, amountMinor: order.totalMinor,
    });
  });
}
