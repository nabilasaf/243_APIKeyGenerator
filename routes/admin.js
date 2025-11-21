const express = require('express');
const router = express.Router();
const dbPool = require('../db'); 
const checkAuth = require('../middleware/checkAuth');
const bcrypt = require('bcrypt'); // Import bcrypt

const SALT_ROUNDS = 10; // Jumlah salt rounds untuk bcrypt

router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || password.length < 6) {
        const errorMsg = encodeURIComponent('Email dan password wajib diisi, minimal 6 karakter.');
        return res.redirect(`/admin/register?error=${errorMsg}&email=${email || ''}`);
    }

    let connection;
    try {
        const [existingAdmin] = await dbPool.execute('SELECT id FROM admins WHERE email = ?', [email]);
        if (existingAdmin.length > 0) {
            const errorMsg = encodeURIComponent('Email ini sudah terdaftar sebagai Admin.');
            return res.redirect(`/admin/register?error=${errorMsg}&email=${email}`);
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS); // 

        await dbPool.execute(
            'INSERT INTO admins (email, password_hash) VALUES (?, ?)',
            [email, password_hash]
        );

        const successMsg = encodeURIComponent('Registrasi Admin berhasil! Silakan Login.');
        res.redirect(`/admin/login?msg=${successMsg}`);

    } catch (err) {
        console.error('Error during Admin registration:', err);
        const errorMsg = encodeURIComponent('Terjadi kesalahan server saat mendaftar.');
        res.redirect(`/admin/register?error=${errorMsg}&email=${email || ''}`);
    }
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const startTime = Date.now();
    let admin = null; 
    
    if (!email || !password) {
        const errorMsg = encodeURIComponent('Email dan password wajib diisi.');
        return res.redirect(`/admin/login?error=${errorMsg}&email=${email || ''}`);
    }

    try {
        // 1. Database Lookup
        const [admins] = await dbPool.execute(
            'SELECT id, password_hash FROM admins WHERE email = ?', 
            [email] 
        );
        console.log(`[LOGIN TIME] DB Lookup: ${Date.now() - startTime}ms`); // Logging DB

        if (admins.length === 0) {
            const errorMsg = encodeURIComponent('Kombinasi email/password salah.');
            return res.redirect(`/admin/login?error=${errorMsg}&email=${email}`);
        }

        admin = admins[0];
        
        // 2. Password Comparison (Bcrypt)
        const match = await bcrypt.compare(password, admin.password_hash);
        console.log(`[LOGIN TIME] Bcrypt Compare: ${Date.now() - startTime}ms`); // Logging Bcrypt

        if (match) {
            req.session.isAdminLoggedIn = true;
            req.session.adminId = admin.id;

            const successMsg = encodeURIComponent('Login berhasil!');
            
            req.session.save(err => {
                if (err) {
                    console.error("Gagal menyimpan sesi:", err);
                    return res.status(500).send("Error menyimpan sesi.");
                }
                console.log(`[LOGIN TIME] Total Success: ${Date.now() - startTime}ms`);
                res.redirect(`/admin/dashboard?msg=${successMsg}`);
            });

        } else {
            const errorMsg = encodeURIComponent('Kombinasi email/password salah.');
            res.redirect(`/admin/dashboard?error=${errorMsg}`);
        }

    } catch (err) {
        console.error('Error during Admin login:', err);
        const errorMsg = encodeURIComponent('Terjadi kesalahan server saat login.');
        res.redirect(`/admin/login?error=${errorMsg}&email=${email || ''}`);
    }
});

router.get('/logout', (req, res) => {
    if (req.session.isAdminLoggedIn) {
        
        req.session.destroy(err => {
            if (err) {
                console.error('Error during session destruction:', err);
                
                // 🎯 KOREKSI: Deklarasikan variabel errorMsg di sini
                const errorMsg = encodeURIComponent('Logout gagal karena kesalahan server.'); 
                return res.redirect(`/admin/login?error=${errorMsg}`);
            }
            
            const successMsg = encodeURIComponent('Anda telah berhasil logout.');
            res.redirect(`/admin/login?msg=${successMsg}`);
        });

    } else {
        res.redirect('/admin/login');
    }
});

router.get('/dashboard-data', checkAuth, async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id AS user_id, u.first_name, u.last_name, u.email, 
                k.api_key, k.expires_at 
            FROM users u
            LEFT JOIN api_keys k ON u.id = k.user_id
            ORDER BY u.id DESC;
        `;
        
        const [rows] = await dbPool.execute(query);
        
        const usersData = rows.map(row => {
            const now = new Date();
            const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
            
            // Logika Status: Kunci Aktif hanya jika ada dan belum kedaluwarsa
            const status = (row.api_key && expiresAt && expiresAt > now) ? 'Active' : 'Inactive';
            
            return {
                user_id: row.user_id,
                first_name: row.first_name,
                last_name: row.last_name,
                email: row.email,
                api_key: row.api_key,
                expires_at: row.expires_at,
                status: status
            };
        });

        // Kirim data yang telah diproses
        res.json(usersData); 

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: true, message: 'Gagal mengambil data dashboard' });
    }
});
router.post('/delete-user/:id', checkAuth, async (req, res) => {
    // Ambil ID pengguna dari URL parameter
    const userId = req.params.id; 

    if (!userId) {
        return res.redirect('/admin/dashboard-data?error=' + encodeURIComponent('ID pengguna tidak valid.'));
    }

    try {
        // Hapus pengguna. Karena ON DELETE CASCADE, API Key terkait juga terhapus.
        const [result] = await dbPool.execute('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            const errorMsg = encodeURIComponent('Pengguna tidak ditemukan.');
            return res.redirect(`/admin/dashboard-data?error=${errorMsg}`);
        }

        const successMsg = encodeURIComponent(`Pengguna ID ${userId} berhasil dihapus.`);
        // Redirect kembali ke dashboard dengan pesan sukses
       res.redirect(`/admin/dashboard?msg=${successMsg}`);

    } catch (error) {
        console.error('Error deleting user:', error);
        const errorMsg = encodeURIComponent('Gagal menghapus pengguna karena kesalahan database.');
        res.redirect(`/admin/dashboard-data?error=${errorMsg}`);
    }
});

module.exports = router;