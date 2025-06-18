// controllers/messageController.js

// Impor koneksi database dari file konfigurasi Anda
const { db } = require('../config/firebase');

/**
 * Mengambil semua pesan dari sebuah chat room, diurutkan berdasarkan waktu.
 */
exports.getChatHistory = async (req, res) => {
    const { chatId } = req.params;

    try {
        const messagesRef = db.collection('chats').doc(chatId).collection('messages');
        const snapshot = await messagesRef.orderBy('timestamp', 'asc').get();

        if (snapshot.empty) {
            // Jika belum ada pesan, kirim array kosong. Ini bukan error.
            return res.status(200).json([]);
        }

        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(messages);

    } catch (error) {
        console.error('Error saat mengambil riwayat chat:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil riwayat chat.' });
    }
};
