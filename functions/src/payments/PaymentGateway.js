/**
 * Interface (documented contract). Every gateway implements:
 *   createCheckout(order) -> Promise<{ checkoutUrl, providerRef }>
 *   verifyWebhook(headers, rawBody) -> { valid, event?: { providerRef, orderId, status, amountMinor } }
 *   verifyTransaction(reference) -> Promise<{ status, providerRef, orderId, amountMinor }>
 */
class PaymentGateway {
  async createCheckout() { throw new Error('Not implemented'); }
  verifyWebhook() { throw new Error('Not implemented'); }
  async verifyTransaction() { throw new Error('Not implemented'); }
}

module.exports = { PaymentGateway };
