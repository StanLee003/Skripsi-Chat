// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');

// Konfigurasi Multer untuk menyimpan file di memori
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // Batas 5 MB
    },
});

// Contoh: GET /api/users/search?query=@johndoe
router.get('/search', userController.searchUser);

// Rute untuk menambahkan kontak baru
router.post('/contacts', userController.addContact);

// Rute untuk memperbarui profil pengguna. :uid adalah parameter dinamis.
router.put('/:uid', userController.updateProfile);

// Rute untuk mengambil semua kontak dari seorang pengguna
router.get('/:uid/contacts', userController.getContacts);

// Rute untuk mengambil profil pengguna tunggal
router.get('/:uid/profile', userController.getUserProfile);

// Rute untuk mengunggah avatar. Middleware 'upload.single('avatar')' akan menangani file.
router.post('/:uid/avatar', upload.single('avatar'), userController.uploadAvatar);

module.exports = router;