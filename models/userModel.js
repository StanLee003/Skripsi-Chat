const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

const usersCollection = db.collection('users');

exports.createUser = async (uid, email, displayName, username) => {
  const newUser = {
    uid,
    email,
    displayName,
    username, // Menggunakan username
    photoURL: '',
    languagePreference: 'en', // Bahasa default
    contacts: [],
    isAdmin: false,
    createdAt: new Date(),
  };
  await usersCollection.doc(uid).set(newUser);
  return newUser;
};

exports.findUserById = async (uid) => {
    const doc = await usersCollection.doc(uid).get();
    return doc.exists ? doc.data() : null;
};

exports.findUserByUsername = async (username) => {
    const snapshot = await usersCollection.where('username', '==', username).limit(1).get();
    if (snapshot.empty) {
        return null;
    }
    return snapshot.docs[0].data();
};

// Fungsi untuk menambahkan kontak
exports.addContact = async (currentUserId, targetUserId) => {
    const currentUserRef = usersCollection.doc(currentUserId);
    const targetUserRef = usersCollection.doc(targetUserId);

    // Gunakan transaksi untuk memastikan kedua update berhasil
    await db.runTransaction(async (transaction) => {
        // Tambahkan target ke daftar kontak pengguna saat ini
        transaction.update(currentUserRef, {
            contacts: FieldValue.arrayUnion(targetUserId)
        });
        // Tambahkan pengguna saat ini ke daftar kontak target
        transaction.update(targetUserRef, {
            contacts: FieldValue.arrayUnion(currentUserId)
        });
    });
};

// Fungsi untuk memperbarui profil pengguna
exports.updateProfile = async (uid, profileData) => {
    const userRef = usersCollection.doc(uid);
    await userRef.update(profileData);
    const updatedDoc = await userRef.get();
    return updatedDoc.data();
};

// Fungsi untuk mengambil detail dari beberapa pengguna berdasarkan UID
exports.getUsersByUids = async (uids) => {
    if (!uids || uids.length === 0) {
        return [];
    }
    // Firestore 'in' query hanya bisa menerima maksimal 10 item per permintaan
    const snapshot = await usersCollection.where('uid', 'in', uids).get();
    const users = [];
    snapshot.forEach(doc => {
        users.push(doc.data());
    });
    return users;
};

// Fungsi untuk mengambil semua pengguna
exports.getAllUsers = async () => {
    const snapshot = await usersCollection.get();
    const users = [];
    snapshot.forEach(doc => {
        users.push(doc.data());
    });
    return users;
};

// Fungsi untuk menghapus dokumen pengguna
exports.deleteUser = async (uid) => {
    await usersCollection.doc(uid).delete();
};