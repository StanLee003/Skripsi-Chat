// middleware/authMiddleware.js

const { auth } = require('../config/firebase');
const userModel = require('../models/userModel');

// Middleware untuk memeriksa token dan status admin
const isAdmin = async (req, res, next) => {
    // DEBUG: 1. Cek apakah middleware dipanggil
    console.log('--- Middleware isAdmin Dijalankan ---');

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Middleware Gagal: Token tidak ditemukan atau format salah.');
        return res.status(401).json({ message: 'Tidak terotentikasi: Token tidak ditemukan.' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // DEBUG: 2. Cek apakah token berhasil diekstrak
    console.log('Token diterima:', idToken ? 'Ada' : 'Tidak Ada');

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // DEBUG: 3. Cek UID dari token yang diverifikasi
        console.log('Token valid untuk UID:', uid);
        
        const user = await userModel.findUserById(uid);
        
        // DEBUG: 4. Cek data pengguna yang diambil dari Firestore
        console.log('Data pengguna dari Firestore:', user);
        
        if (user && user.isAdmin === true) {
            console.log('Hasil: Akses DIIZINKAN. Pengguna adalah admin.');
            req.user = user;
            next();
        } else {
            console.log(`Hasil: Akses DITOLAK. Status admin: ${user?.isAdmin}`);
            return res.status(403).json({ message: 'Akses ditolak: Anda bukan admin.' });
        }
    } catch (error) {
        console.error('Middleware Error: Gagal verifikasi token.', error);
        return res.status(401).json({ message: 'Tidak terotentikasi: Token tidak valid.' });
    }
};

module.exports = { isAdmin };