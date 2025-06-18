// File: config/socket.js

// Impor koneksi database dari file konfigurasi Anda
const { db } = require('../config/firebase');

// [PEMBARUAN] Pastikan baris ini ada dan tidak di-comment
// Ini akan memuat translationService, yang kemudian akan memuat openai.js
const { translateText } = require('../services/translationService');

const initializeSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Pengguna baru terhubung: ${socket.id}`);

        socket.on('joinPersonalRoom', (userId) => {
            socket.join(userId);
            console.log(`Pengguna ${socket.id} bergabung ke ruang pribadinya: ${userId}`);
        });

        socket.on('chatMessage', async (data) => {
            const { senderId, recipientId, message, targetLanguage } = data;

            if (!senderId || !recipientId || !message) {
                console.error("Data pesan tidak lengkap:", data);
                socket.emit('messageError', { message: 'Data tidak lengkap, pesan gagal dikirim.' });
                return;
            }

            try {
                // Menggunakan fungsi translasi dari layanan Anda
                const translatedText = await translateText(message, targetLanguage || 'en');
                
                const newChatMessage = {
                    senderId,
                    recipientId,
                    originalText: message,
                    translatedText: translatedText,
                    timestamp: new Date()
                };

                const chatId = [senderId, recipientId].sort().join('_');
                const messagesRef = db.collection('chats').doc(chatId).collection('messages');
                const docRef = await messagesRef.add(newChatMessage);
                
                const savedMessage = (await docRef.get()).data();
                
                io.to(recipientId).emit('newMessage', { id: docRef.id, ...savedMessage });
                io.to(senderId).emit('newMessage', { id: docRef.id, ...savedMessage });

            } catch (error) {
                console.error('Error saat memproses pesan chat:', error);
                socket.emit('messageError', { message: 'Gagal mengirim pesan.' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Pengguna terputus: ${socket.id}`);
        });
    });
};

module.exports = initializeSocket;