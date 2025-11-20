const crypto = require('crypto');

/**
 * Menghasilkan API Key unik 64 karakter.
 * @returns {string} API Key
 */
const generateApiKey = () => {
    // Menghasilkan 32 byte random, lalu diencode sebagai heksadesimal (64 karakter)
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Menghitung tanggal kedaluwarsa 30 hari dari sekarang.
 * @returns {Date} Tanggal kedaluwarsa
 */
const getExpiryDate = () => {
    const expiresAt = new Date();
    // Tambahkan 30 hari (30 * 24 * 60 * 60 * 1000 milidetik)
    expiresAt.setDate(expiresAt.getDate() + 30);
    return expiresAt;
};

module.exports = {
    generateApiKey,
    getExpiryDate
};