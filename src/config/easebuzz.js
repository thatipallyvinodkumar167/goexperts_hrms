// c:\Users\DELL\Desktop\HRMS\src\config\easebuzz.js
import crypto from "crypto";

/**
 * EZ – a tiny “SDK” that hides the hashing details.
 *
 * The fields and order are exactly what Easebuzz expects:
 *   key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|salt
 *
 * The verify routine uses the reverse‑order string defined by Easebuzz:
 *   salt|status|...|email|firstname|productinfo|amount|txnid|key
 */
export const EZ = {
  // ---- configuration ---------------------------------------------------------
  key: process.env.EASEBUZZ_KEY,
  salt: process.env.EASEBUZZ_SALT,
  apiUrl: process.env.EASEBUZZ_API_URL,
  env: process.env.EASEBUZZ_ENV || "PROD",

  /**
   * Build the request hash that must be sent to Easebuzz when creating an order.
   *
   * @param {Object} params  - Required fields for the hash.
   * @returns {string} SHA‑512 hash in hex format.
   */
  generateRequestHash({
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
  }) {
    // Join all parts with pipe characters, then hash.
    const raw = [
      this.key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      this.salt,
    ].join("|");
    return crypto.createHash("sha512").update(raw).digest("hex");
  },

  /**
   * Verify the response hash received from Easebuzz after payment.
   *
   * @param {Object} response - Entire JSON body sent back by Easebuzz.
   * @returns {boolean} true if the hash matches, false otherwise.
   */
  verifyResponseHash(response) {
    const {
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1 = "",
      udf2 = "",
      udf3 = "",
      udf4 = "",
      udf5 = "",
      hash: receivedHash,
    } = response;

    // Build the reverse‑ordered string as per Easebuzz docs.
    const raw = [
      this.salt,
      status,
      "", "", "", "", "", "", // placeholders for optional fields we don't use
      udf5,
      udf4,
      udf3,
      udf2,
      udf1,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      this.key,
    ].join("|");

    const calculated = crypto.createHash("sha512").update(raw).digest("hex");
    return calculated === receivedHash;
  },
};