const crypto = require('crypto');

/**
 * Menghasilkan string API Key acak dan aman secara kriptografis.
 * @returns {string} API Key sepanjang 32 karakter
 */
const generateApiKey = () => {
    // Menghasilkan 16 byte random dan mengkonversinya ke string hex (32 karakter)
    return crypto.randomBytes(16).toString('hex');
};

module.exports = {
    generateApiKey,
};