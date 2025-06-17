// config/firebase.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

// Pastikan file serviceAccountKey.json ada di folder root proyek Anda
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'gs://node-firebase-chat-37719.firebasestorage.app'
});

const db = getFirestore();
const auth = getAuth();
const bucket = getStorage().bucket();

console.log('✅ Berhasil terhubung ke Firebase Services.');

module.exports = { db, auth, bucket };