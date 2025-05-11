const axios = require("axios");

/**
 * Verifies a Cloudflare Turnstile token.
 * @param {string} token - The Turnstile token from the client.
 * @param {string} secretKey - Your Turnstile secret key.
 * @param {string} [remoteIp] - (Optional) User's IP address.
 * @returns {Promise<{ success: boolean, errorCodes?: string[] }>}
 */
async function verifyTurnstileToken(token, secretKey, remoteIp) {
  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);
  if (remoteIp) formData.append("remoteip", remoteIp);

  try {
    const res = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log(res.data);
    const data = res.data;
    return {
      success: data.success,
      errorCodes: data["error-codes"],
    };
  } catch (err) {
    console.error("Turnstile verify error:", err.message);
    console.error(err.response.data);
    return {
      success: false,
      errorCodes: ["internal_error"],
    };
  }
}
module.exports = { verifyTurnstileToken };