// controllers/chatController.js

const userModel = require('../models/userModel');
const messageModel = require('../models/messageModel');
const translationService = require('../services/translationService');

exports.handleMessage = async (io, socket, data) => {
  const { senderId, recipientId, message } = data;

  // Membuat nama room yang konsisten antara dua pengguna
  const room = [senderId, recipientId].sort().join('_');

  try {
    const recipientData = await userModel.findUserById(recipientId);
    if (!recipientData) throw new Error('Penerima tidak ditemukan.');

    const targetLang = recipientData.languagePreference || 'en';
    const translatedText = await translationService.translateText(message, targetLang);

    const messageData = {
        senderId,
        timestamp: new Date(),
        originalText: message,
        translations: {
            [targetLang]: translatedText,
        },
    };
    
    await messageModel.saveMessage(room, messageData);

    // Kirim pesan ke pengirim dan penerima melalui room pribadi mereka
    io.to(senderId).emit('newMessage', { ...messageData, text: messageData.originalText });
    io.to(recipientId).emit('newMessage', { ...messageData, text: translatedText });
    
  } catch (error) {
    console.error(`Error di room ${room}:`, error);
    socket.emit('chatError', 'Gagal mengirim pesan.');
  }
};