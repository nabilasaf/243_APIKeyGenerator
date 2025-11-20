/**
 * Middleware untuk memverifikasi apakah admin sudah login.
 */
const checkAuth = (req, res, next) => {
    if (req.session && req.session.isAdminLoggedIn) {
        // Admin sudah login, lanjutkan ke route berikutnya
        return next();
    } else {
        // Belum login, redirect ke halaman login
        res.redirect('/admin/login');
    }
};

module.exports = checkAuth;