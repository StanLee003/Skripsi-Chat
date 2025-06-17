// config/socket.js

const chatController = require('../controllers/chatController');

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Pengguna baru terhubung: ${socket.id}`);

    // Bergabung ke ruang chat pribadi berdasarkan user ID-nya
    socket.on('joinPersonalRoom', (userId) => {
        socket.join(userId);
        console.log(`Pengguna ${socket.id} bergabung ke ruang pribadinya: ${userId}`);
    });

    // Menangani pengiriman pesan
    socket.on('chatMessage', (data) => {
        chatController.handleMessage(io, socket, data);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Pengguna terputus: ${socket.id}`);
    });
  });
};

module.exports = initializeSocket;