// routes/public.js (Menggunakan Transaksi dan expires_at)
const express = require('express');
const router = express.Router();
const dbPool = require('../db'); 
const { generateApiKey } = require('../utils/keyGenerator');

// ===============================================
// RUTE PUBLIC (API)
// ===============================================

router.post('/register-with-key', async (req, res) => {
    const { first_name, last_name, email } = req.body;
    
    // Validasi input
    if (!first_name || !last_name || !email) {
        // ... (Error handling remains the same)
        const errorMsg = encodeURIComponent('Semua field wajib diisi.');
        return res.redirect(`/?error=${errorMsg}&fn=${first_name || ''}&ln=${last_name || ''}&em=${email || ''}`);
    }

    let connection; // Variabel koneksi dideklarasikan di luar try
    try {
        // 1. Cek apakah email sudah terdaftar (Lakukan sebelum transaksi dimulai)
        const [existingUser] = await dbPool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            const errorMsg = encodeURIComponent('Email sudah terdaftar. Silakan login atau gunakan email lain.');
            return res.redirect(`/?error=${errorMsg}`);
        }

        // --- MULAI TRANSAKSI ---
        connection = await dbPool.getConnection(); // Ambil koneksi dari pool
        await connection.beginTransaction(); // Mulai transaksi ACID

        // 2. Generate API Key dan Hitung Kedaluwarsa
        const apiKey = generateApiKey();
        const expirationDate = new Date();
        // Set kedaluwarsa 1 tahun dari sekarang (Atur sesuai kebijakan Anda)
        expirationDate.setFullYear(expirationDate.getFullYear() + 1); 

        // 3a. Simpan pengguna baru (Gunakan 'connection' yang diambil)
        const [userResult] = await connection.execute(
            'INSERT INTO users (first_name, last_name, email) VALUES (?, ?, ?)',
            [first_name, last_name, email]
        );
        const newUserId = userResult.insertId;

        // 3b. Simpan API Key (Gunakan 'connection' yang sama)
        await connection.execute(
            'INSERT INTO api_keys (user_id, api_key, expires_at) VALUES (?, ?, ?)',
            [newUserId, apiKey, expirationDate] // Gunakan expirationDate
        );
        
        await connection.commit(); // ✅ COMMIT: Semua operasi sukses

        // 4. Redirect Sukses
        const successMsg = encodeURIComponent('Pendaftaran Berhasil! Key telah dibuat dan disimpan.');
        res.redirect(`/?success=${successMsg}&finalKey=${apiKey}`);

    } catch (err) {
        if (connection) {
            await connection.rollback(); // ❌ ROLLBACK: Batalkan semua jika ada kegagalan
        }
        console.error('Error during API key registration (ROLLBACK EXECUTED):', err);
        const errorMsg = encodeURIComponent('Terjadi kesalahan server saat mendaftar.');
        res.redirect(`/?error=${errorMsg}&fn=${first_name || ''}&ln=${last_name || ''}&em=${email || ''}`);
    } finally {
        if (connection) {
            connection.release(); // Selalu bebaskan koneksi
        }
    }
});

module.exports = router;