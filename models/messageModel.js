// models/messageModel.js

const { db } = require('../config/firebase');

// Fungsi untuk menyimpan pesan ke Firestore
exports.saveMessage = async (room, messageData) => {
    const chatRef = db.collection('chats').doc(room).collection('messages');
    return await chatRef.add(messageData);
};