// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// Terapkan middleware isAdmin ke semua rute di file ini
router.use(isAdmin);

// Rute untuk mendapatkan semua pengguna
router.get('/users', adminController.getAllUsers);

// Rute untuk menghapus pengguna berdasarkan UID
router.delete('/users/:uid', adminController.deleteUser);

// Rute untuk mengubah status admin pengguna
router.put('/users/:uid/admin-status', adminController.updateUserAdminStatus);


module.exports = router;
