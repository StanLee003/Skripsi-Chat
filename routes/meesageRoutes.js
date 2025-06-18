// routes/messageRoutes.js

const express = require('express');
const router = express.Router();

// Impor controller yang akan kita buat
const { getChatHistory } = require('../controllers/messageController');

// Definisikan rute untuk mengambil riwayat chat berdasarkan ID chat
// GET /api/messages/:chatId
router.get('/:chatId', getChatHistory);

module.exports = router;