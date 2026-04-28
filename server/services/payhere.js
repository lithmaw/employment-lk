const md5 = require('md5');

/**
 * Generates the PayHere MD5 hash for payment initiation.
 * Formula: MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase()).toUpperCase()
 */
function generateHash(merchantId, orderId, amount, currency, merchantSecret) {
  const secretHash = md5(merchantSecret).toUpperCase();
  return md5(merchantId + orderId + amount + currency + secretHash).toUpperCase();
}

/**
 * Verifies the MD5 signature sent by PayHere on notify_url callback.
 * Formula: MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(secret).toUpperCase()).toUpperCase()
 */
function verifyNotifyHash(params, merchantSecret) {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = params;
  const secretHash = md5(merchantSecret).toUpperCase();
  const expected   = md5(
    merchant_id + order_id + payhere_amount + payhere_currency + status_code + secretHash
  ).toUpperCase();
  return expected === md5sig;
}

module.exports = { generateHash, verifyNotifyHash };
