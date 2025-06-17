// controllers/adminController.js

const userModel = require('../models/userModel');
const { auth } = require('../config/firebase');

// Mengambil semua pengguna
exports.getAllUsers = async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil daftar pengguna.", error: error.message });
    }
};

// Menghapus pengguna
exports.deleteUser = async (req, res) => {
    const { uid } = req.params;
    try {
        // Hapus dari Firebase Authentication
        await auth.deleteUser(uid);
        // Hapus dari database Firestore
        await userModel.deleteUser(uid);
        
        res.status(200).json({ message: `Pengguna dengan UID ${uid} berhasil dihapus.` });
    } catch (error) {
        console.error(`Gagal menghapus pengguna ${uid}:`, error);
        res.status(500).json({ message: "Gagal menghapus pengguna.", error: error.message });
    }
};

// Mengubah status admin pengguna
exports.updateUserAdminStatus = async (req, res) => {
    const { uid } = req.params;
    const { isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
        return res.status(400).json({ message: "Properti 'isAdmin' harus bernilai boolean." });
    }

    try {
        const updatedUser = await userModel.updateProfile(uid, { isAdmin });
        res.status(200).json({ message: `Status admin untuk pengguna ${uid} berhasil diubah.`, user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengubah status admin.", error: error.message });
    }
};