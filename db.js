
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ZaZaR!CH1', 
    database: process.env.DB_NAME || 'api_key_manager',
    port: process.env.DB_PORT || 3308,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✓ Berhasil terhubung ke database MySQL');
        connection.release();
    } catch (error) {
        console.error('✗ Gagal terhubung ke database:', error.message);
        console.error('Full Error:', error);
        process.exit(1); // Keluar jika koneksi gagal
    }
}

testConnection();

module.exports = pool;