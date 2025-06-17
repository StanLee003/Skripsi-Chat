// controllers/authController.js

const { auth } = require('../config/firebase');
const userModel = require('../models/userModel');

exports.register = async (req, res) => {
    const { email, password, displayName, username } = req.body;

    // Memastikan semua field yang diperlukan ada
    if (!email || !password || !displayName || !username) {
        return res.status(400).json({ message: "Email, password, displayName, dan username diperlukan." });
    }

    // Validasi sederhana untuk format username
    if (username.length < 3 || /\s/.test(username)) {
        return res.status(400).json({ message: "Username harus minimal 3 karakter dan tidak boleh mengandung spasi." });
    }

    try {
        // Langkah 1: Cek apakah username sudah digunakan
        const usernameExists = await userModel.findUserByUsername(username);
        if (usernameExists) {
            return res.status(409).json({ message: "Username ini sudah digunakan oleh pengguna lain." }); // 409 Conflict
        }

        // Langkah 2: Jika username unik, lanjutkan membuat user di Firebase Auth
        const userRecord = await auth.createUser({ email, password, displayName });
        
        // Langkah 3: Buat data user di Firestore dengan username yang sudah divalidasi
        const newUser = await userModel.createUser(userRecord.uid, email, displayName, username);

        res.status(201).json({ message: "Registrasi berhasil", user: newUser });

    } catch (error) {
        // Menangani error spesifik dari Firebase Auth
        if (error.code === 'auth/email-already-exists') {
             return res.status(409).json({ message: "Alamat email ini sudah terdaftar." });
        }
        console.error("Error saat registrasi:", error);
        res.status(500).json({ message: "Gagal melakukan registrasi", error: error.message });
    }
};

// Fungsi login akan ditangani di frontend menggunakan Firebase Client SDK,
// backend hanya perlu menerima token untuk verifikasi jika diperlukan.