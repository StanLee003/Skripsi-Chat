// controllers/userController.js

const userModel = require('../models/userModel');
const { bucket } = require('../config/firebase');
const { format } = require('util');

// Controller untuk mengunggah foto profil
exports.uploadAvatar = async (req, res) => {
    const { uid } = req.params;

    if (!req.file) {
        return res.status(400).send('Tidak ada file yang diunggah.');
    }
    
    try {
        const userDoc = await userModel.findUserById(uid);
        const oldPhotoURL = userDoc?.photoURL;

        if (oldPhotoURL) {
            try {
                // PERBAIKAN: Logika baru yang lebih aman untuk mengekstrak nama file
                const prefix = `https://storage.googleapis.com/${bucket.name}/`;
                if (oldPhotoURL.startsWith(prefix)) {
                    const oldFilePath = oldPhotoURL.substring(prefix.length).split('?')[0];
                    const decodedFilePath = decodeURIComponent(oldFilePath);
                    await bucket.file(decodedFilePath).delete();
                    console.log(`Foto profil lama dihapus: ${decodedFilePath}`);
                }
            } catch (deleteError) {
                console.warn(`Gagal menghapus foto lama:`, deleteError.message);
            }
        }
    } catch (fetchError) {
        console.error("Gagal mengambil profil untuk menghapus foto lama:", fetchError);
    }

    const blob = bucket.file(`avatars/${uid}_${Date.now()}_${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: req.file.mimetype,
    });

    blobStream.on('error', (err) => {
        res.status(500).send({ message: err.message });
    });

    blobStream.on('finish', async () => {
        try {
            await blob.makePublic();
            const publicUrl = blob.publicUrl();
            
            await userModel.updateProfile(uid, { photoURL: publicUrl });
            
            res.status(200).send({
                message: 'Foto profil berhasil diunggah.',
                photoURL: publicUrl
            });
        } catch (err) {
            console.error("Gagal mempublikasikan file atau update profil", err);
            res.status(500).send({ message: 'Gagal memproses unggahan foto.' });
        }
    });

    blobStream.end(req.file.buffer);
};

// Controller untuk mengambil profil pengguna tunggal
exports.getUserProfile = async (req, res) => {
    const { uid } = req.params;
    try {
        const user = await userModel.findUserById(uid);
        if (user) {
            res.status(200).json({ 
                displayName: user.displayName, 
                username: user.username,
                languagePreference: user.languagePreference,
                photoURL: user.photoURL,
                isAdmin: user.isAdmin // PERBAIKAN: Menambahkan field ini
            });
        } else {
            res.status(404).json({ message: 'Profil pengguna tidak ditemukan di database.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil profil pengguna.' });
    }
};

exports.searchUser = async (req, res) => {
    const { query } = req.query; // contoh: /api/users/search?query=johndoe

    if (!query) {
        return res.status(400).json({ message: 'Parameter query diperlukan.' });
    }

    try {
        const user = await userModel.findUserByUsername(query);
        if (user) {
            // Hanya kirim data yang tidak sensitif
            res.json({ uid: user.uid, displayName: user.displayName, username: user.username });
        } else {
            res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
}

// Fungsi controller untuk menambahkan kontak
exports.addContact = async (req, res) => {
    // Di aplikasi nyata, currentUserId akan didapat dari token otentikasi
    // Untuk saat ini, kita kirimkan melalui body untuk kemudahan pengujian
    const { currentUserId, targetUserId } = req.body;

    if (!currentUserId || !targetUserId) {
        return res.status(400).json({ message: "currentUserId dan targetUserId diperlukan." });
    }
    if (currentUserId === targetUserId) {
        return res.status(400).json({ message: "Tidak dapat menambahkan diri sendiri sebagai kontak." });
    }

    try {
        await userModel.addContact(currentUserId, targetUserId);
        res.status(200).json({ message: "Kontak berhasil ditambahkan." });
    } catch (error) {
        console.error("Error saat menambahkan kontak:", error);
        res.status(500).json({ message: "Gagal menambahkan kontak.", error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { uid } = req.params; 
    const { displayName, languagePreference, photoURL } = req.body;

    const dataToUpdate = {};
    if (displayName) dataToUpdate.displayName = displayName;
    if (languagePreference) dataToUpdate.languagePreference = languagePreference;
    if (photoURL) dataToUpdate.photoURL = photoURL; // Tambahkan photoURL jika ada

    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: "Tidak ada data yang dikirim untuk diupdate." });
    }

    try {
        const updatedUser = await userModel.updateProfile(uid, dataToUpdate);
        res.status(200).json({ message: "Profil berhasil diperbarui.", user: updatedUser });
    } catch (error) {
        console.error("Error saat memperbarui profil:", error);
        res.status(500).json({ message: "Gagal memperbarui profil.", error: error.message });
    }
};

// Controller untuk mengambil daftar kontak
exports.getContacts = async (req, res) => {
    const { uid } = req.params;
    try {
        // 1. Ambil data pengguna utama untuk mendapatkan daftar UID kontaknya
        const user = await userModel.findUserById(uid);
        if (!user) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        // 2. Ambil detail dari setiap kontak menggunakan daftar UID
        const contactsDetails = await userModel.getUsersByUids(user.contacts);
        
        res.status(200).json(contactsDetails);
    } catch (error) {
        console.error("Error saat mengambil kontak:", error);
        res.status(500).json({ message: "Gagal mengambil kontak.", error: error.message });
    }
};