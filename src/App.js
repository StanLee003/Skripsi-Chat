// src/App.js

// PERINTAH PENTING: Jalankan perintah ini di terminal Anda jika belum
// npm install axios firebase socket.io-client lucide-react

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { io } from "socket.io-client";
import { Send, LogOut, Menu, Search, UserPlus, X, Paperclip, Smile, Settings, Camera, ShieldCheck } from 'lucide-react';

// --- Konfigurasi ---
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const BACKEND_URL = 'http://localhost:4000';
const socket = io(BACKEND_URL);

// --- Komponen Utama ---
function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('chat');

    const refreshUserData = useCallback(async (firebaseUser) => {
        if (!firebaseUser) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const profileRes = await axios.get(`${BACKEND_URL}/api/users/${firebaseUser.uid}/profile`);
            const enrichedUser = {
                ...firebaseUser,
                ...profileRes.data,
            };
            setUser(enrichedUser);
        } catch (error) {
            console.error("Gagal mengambil profil Firestore, menggunakan data Auth:", error);
            setUser(firebaseUser);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            refreshUserData(currentUser);
        });
        return () => unsubscribe();
    }, [refreshUserData]);

    const handleLogout = () => signOut(auth);

    if (loading) return <div className="bg-gray-900 h-screen flex items-center justify-center"><p className="text-white text-xl">Memuat...</p></div>;

    const renderPage = () => {
        if (!user) {
            return <AuthPage />;
        }
        if (currentPage === 'admin' && user.isAdmin) {
            return <AdminPage currentUser={user} navigateToChat={() => setCurrentPage('chat')} />;
        }
        return <ChatPage currentUser={user} onLogout={handleLogout} onProfileUpdate={() => refreshUserData(user)} navigateToAdmin={() => setCurrentPage('admin')} />;
    };

    return (
        <div className="bg-gray-800 text-white h-screen w-screen overflow-hidden font-sans">
            {renderPage()}
        </div>
    );
}

// --- Halaman Otentikasi ---
const AuthPage = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError("Password harus minimal 6 karakter.");
            return;
        }
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            await axios.post(`${BACKEND_URL}/api/auth/register`, { email, password, displayName, username });
            setSuccessMessage('Registrasi berhasil! Silakan login.');
            setTimeout(() => {
                setIsLoginMode(true);
                setSuccessMessage('');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mendaftar. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Email atau password salah.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setError('');
        setSuccessMessage('');
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900">
            <div className="w-full max-w-md p-6 md:p-8 space-y-6 bg-gray-800 rounded-lg shadow-2xl">
                <h1 className="text-2xl md:text-3xl font-bold text-center text-indigo-400">
                    {isLoginMode ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
                </h1>
                <p className="text-center text-gray-400 text-sm md:text-base">
                    {isLoginMode ? 'Masuk untuk melanjutkan obrolan.' : 'Isi data untuk memulai.'}
                </p>
                <form onSubmit={isLoginMode ? handleLogin : handleRegister} className="space-y-4">
                    {!isLoginMode && (
                        <>
                            <InputField label="Nama Tampilan" type="text" value={displayName} onChange={setDisplayName} placeholder="Nama Lengkap Anda" required />
                            <InputField label="Username" type="text" value={username} onChange={setUsername} placeholder="username_unik" required />
                        </>
                    )}
                    <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="anda@example.com" required />
                    <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    {successMessage && <p className="text-sm text-green-400 text-center">{successMessage}</p>}
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 text-base font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-indigo-500 disabled:cursor-not-allowed transition-all duration-300">
                        {loading ? 'Memproses...' : (isLoginMode ? 'Login' : 'Register')}
                    </button>
                </form>
                <p className="text-sm text-center text-gray-400">
                    {isLoginMode ? "Belum punya akun?" : "Sudah punya akun?"}
                    <button onClick={toggleMode} className="ml-2 font-semibold text-indigo-400 hover:text-indigo-500 focus:outline-none">
                        {isLoginMode ? 'Register di sini' : 'Login di sini'}
                    </button>
                </p>
            </div>
        </div>
    );
};

// --- Halaman Chat ---
const ChatPage = ({ currentUser, onLogout, onProfileUpdate, navigateToAdmin }) => {
    const [contacts, setContacts] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);
    const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const fetchContacts = useCallback(async () => {
        if (!currentUser) return;
        try {
            const response = await axios.get(`${BACKEND_URL}/api/users/${currentUser.uid}/contacts`);
            setContacts(response.data);
        } catch (error) {
            console.error("Gagal mengambil kontak:", error);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchContacts();
        socket.emit('joinPersonalRoom', currentUser.uid);
        const handleNewMessage = (message) => {
            if (selectedChat && (message.senderId === selectedChat.uid || message.senderId === currentUser.uid)) {
                setMessages(prev => [...prev, message]);
            }
        };
        socket.on('newMessage', handleNewMessage);
        return () => socket.off('newMessage', handleNewMessage);
    }, [currentUser.uid, selectedChat, fetchContacts]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;
        const messageData = { 
            senderId: currentUser.uid, 
            recipientId: selectedChat.uid, 
            message: newMessage,
            targetLanguage: selectedChat.languagePreference || 'en'
        };
        socket.emit('chatMessage', messageData);
        setNewMessage("");
    };

    const handleSelectChat = async (contact) => {
        setSelectedChat(contact);
        setSidebarOpen(false);
        setIsLoadingHistory(true);
        setMessages([]);

        try {
            const chatId = [currentUser.uid, contact.uid].sort().join('_');
            const response = await axios.get(`${BACKEND_URL}/api/messages/${chatId}`);
            setMessages(response.data);
        } catch (error) {
            console.error("Gagal memuat riwayat chat:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    return (
        <>
            <div className="h-full w-full flex">
                <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-full sm:w-80 lg:w-96 border-r border-gray-700 bg-gray-800 z-30`}>
                    <ContactList currentUser={currentUser} contacts={contacts} onSelectChat={handleSelectChat} onLogout={onLogout} openAddContact={() => setAddContactModalOpen(true)} openEditProfile={() => setEditProfileModalOpen(true)} navigateToAdmin={navigateToAdmin} />
                </div>
                {sidebarOpen && <div className="fixed inset-0 bg-black opacity-50 md:hidden z-20" onClick={() => setSidebarOpen(false)}></div>}
                <div className="flex-1 flex flex-col">
                    <div className="md:hidden p-3 bg-gray-800 flex justify-between items-center shadow-md">
                        <button onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6 text-gray-300" /></button>
                        <h2 className="text-lg font-semibold text-white">{selectedChat ? selectedChat.displayName : "Chat"}</h2>
                        <div className="w-6"></div>
                    </div>
                    {selectedChat ? <ChatWindow chatPartner={selectedChat} messages={messages} currentUser={currentUser} newMessage={newMessage} setNewMessage={setNewMessage} handleSendMessage={handleSendMessage} isLoadingHistory={isLoadingHistory} /> : <WelcomeScreen />}
                </div>
            </div>
            {isAddContactModalOpen && <AddContactModal currentUser={currentUser} closeModal={() => setAddContactModalOpen(false)} onContactAdded={fetchContacts} />}
            {isEditProfileModalOpen && <EditProfileModal currentUser={currentUser} closeModal={() => setEditProfileModalOpen(false)} onProfileUpdate={onProfileUpdate} />}
        </>
    );
};

// --- Komponen-komponen Anak ---

const InputField = ({ label, type, value, onChange, placeholder, required }) => (
    <div>
        <label className="block mb-2 text-sm font-medium text-gray-300">{label}</label>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors" />
    </div>
);

const UserAvatar = ({ user, size = 'large' }) => {
    const sizeClasses = size === 'large' ? 'w-12 h-12' : 'w-10 h-10';
    const initial = user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase();

    if (user.photoURL) {
        return <img src={user.photoURL} alt={user.displayName} className={`${sizeClasses} rounded-full object-cover bg-gray-700`} />;
    }

    return (
        <div className={`${sizeClasses} bg-indigo-500 rounded-full flex-shrink-0 flex items-center justify-center font-bold`}>
            {initial}
        </div>
    );
};

const ContactList = ({ currentUser, contacts, onSelectChat, onLogout, openAddContact, openEditProfile, navigateToAdmin }) => (
    <div className="flex flex-col h-full text-gray-200">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-semibold text-white">Chats</h2>
            <button onClick={openAddContact} className="p-1 text-gray-300 hover:text-white"><UserPlus /></button>
        </div>
        <div className="p-2 flex-shrink-0">
            <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-5 w-5 text-gray-400" /></span><input type="text" placeholder="Cari atau mulai chat baru" className="w-full bg-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {contacts.length > 0 ? contacts.map(contact => (
                <div key={contact.uid} onClick={() => onSelectChat(contact)} className="flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-700/50">
                    <UserAvatar user={contact} size="small" />
                    <div className="flex-1 overflow-hidden ml-3"><p className="font-semibold text-white truncate">{contact.displayName}</p><p className="text-sm text-gray-400 truncate">@{contact.username}</p></div>
                </div>
            )) : <p className="p-4 text-center text-gray-400">Klik ikon tambah untuk mencari teman.</p>}
        </div>
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
            {currentUser.isAdmin && (
                <button onClick={navigateToAdmin} className="w-full flex items-center justify-center p-2 mb-2 rounded-lg text-yellow-400 hover:bg-yellow-500 hover:text-white transition-colors">
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Panel Admin
                </button>
            )}
            <div className="flex items-center mb-4">
                <UserAvatar user={currentUser} size="small" />
                <div className="ml-3 overflow-hidden min-w-0 flex-1"><p className="font-semibold text-white truncate">{currentUser.displayName || "Pengguna"}</p><p className="text-xs text-gray-400 truncate">{currentUser.email}</p></div>
                <button onClick={openEditProfile} className="p-2 text-gray-400 hover:text-white"><Settings className="h-5 w-5"/></button>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center p-2 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"><LogOut className="h-5 w-5 mr-2" />Logout</button>
        </div>
    </div>
);

const ChatWindow = ({ chatPartner, messages, currentUser, newMessage, setNewMessage, handleSendMessage, isLoadingHistory }) => {
    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
            <div className="hidden md:flex p-3 border-b border-gray-700 bg-gray-800 items-center flex-shrink-0">
                <UserAvatar user={chatPartner} size="small" />
                <div className="ml-3">
                    <h2 className="text-md font-semibold text-white">{chatPartner.displayName}</h2>
                    <p className="text-xs text-gray-400">Online</p>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {isLoadingHistory ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-400">Memuat riwayat percakapan...</p>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-2">
                        {messages.map((msg, index) => <MessageBubble key={index} message={msg} isSender={msg.senderId === currentUser.uid} />)}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
            <div className="p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <button type="button" className="p-2 text-gray-400 hover:text-white"><Smile className="h-6 w-6"/></button>
                    <button type="button" className="p-2 text-gray-400 hover:text-white"><Paperclip className="h-6 w-6"/></button>
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Ketik pesan..." className="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white" />
                    <button type="submit" className="p-3 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors flex-shrink-0"><Send className="h-5 w-5 text-white" /></button>
                </form>
            </div>
        </div>
    );
};

const MessageBubble = ({ message, isSender }) => {
    const bubbleClasses = isSender ? "bg-indigo-600 text-white rounded-lg rounded-br-none" : "bg-gray-700 text-gray-200 rounded-lg rounded-bl-none";
    const containerClasses = isSender ? "flex justify-end" : "flex justify-start";

    const mainText = message.translatedText || message.text || "";
    const originalText = message.originalText || (isSender ? "" : message.text);

    let formattedTime = '';
    if (message.timestamp) {
        let date;
        if (typeof message.timestamp.seconds === 'number') {
            date = new Date(message.timestamp.seconds * 1000);
        } else {
            date = new Date(message.timestamp);
        }
        if (!isNaN(date.getTime())) {
            formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    return (
        <div className={containerClasses}>
            <div className={`max-w-xs md:max-w-md px-3 py-2 ${bubbleClasses}`}>
                <p className="text-sm leading-snug">{mainText}</p>
                {!isSender && originalText && originalText !== mainText && (
                    <p className="text-xs text-gray-400 mt-2 pt-1 border-t border-white/20 italic">
                        {originalText}
                    </p>
                )}
                <div className="text-xs text-white/60 mt-1 text-right">{formattedTime}</div>
            </div>
        </div>
    );
};

const WelcomeScreen = () => (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-4 bg-gray-900">
        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4"><svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div>
        <h2 className="text-2xl font-semibold text-gray-300">Skripsi Chat</h2>
        <p className="text-gray-400 mt-2">Pilih teman untuk memulai percakapan.</p>
    </div>
);

const AddContactModal = ({ currentUser, closeModal, onContactAdded }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [addStatus, setAddStatus] = useState({});

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;
        setError('');
        setLoading(true);
        try {
            const response = await axios.get(`${BACKEND_URL}/api/users/search`, { params: { query: searchTerm } });
            setSearchResults(response.data ? [response.data] : []);
        } catch (err) {
            setSearchResults([]);
            setError(err.response?.data?.message || 'Error saat mencari.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async (targetUser) => {
        setAddStatus({ ...addStatus, [targetUser.uid]: 'loading' });
        try {
            await axios.post(`${BACKEND_URL}/api/users/contacts`, { currentUserId: currentUser.uid, targetUserId: targetUser.uid });
            setAddStatus({ ...addStatus, [targetUser.uid]: 'success' });
            onContactAdded();
        } catch (err) {
            setAddStatus({ ...addStatus, [targetUser.uid]: 'error' });
            setError(err.response?.data?.message || 'Gagal menambah kontak.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center"><h2 className="text-lg font-semibold">Tambah Kontak Baru</h2><button onClick={closeModal}><X className="h-6 w-6 text-gray-400 hover:text-white" /></button></div>
                <div className="p-4">
                    <form onSubmit={handleSearch} className="flex space-x-2"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari dengan username..." className="flex-1 px-4 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /><button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-500">{loading ? '...' : <Search />}</button></form>
                    <div className="mt-4 min-h-[100px]">{error && <p className="text-center text-red-400">{error}</p>}{searchResults.map(user => (<div key={user.uid} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700"><div><p className="font-semibold">{user.displayName}</p><p className="text-sm text-gray-400">@{user.username}</p></div><button onClick={() => handleAddContact(user)} disabled={addStatus[user.uid] === 'loading' || addStatus[user.uid] === 'success'} className="px-3 py-1 text-sm rounded-md bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed">{addStatus[user.uid] === 'loading' ? '...' : addStatus[user.uid] === 'success' ? 'Ditambahkan' : 'Tambah'}</button></div>))}</div>
                </div>
            </div>
        </div>
    );
};

// --- MODAL EDIT PROFIL (DIPERBARUI) ---
const EditProfileModal = ({ currentUser, closeModal, onProfileUpdate }) => {
    const [displayName, setDisplayName] = useState(currentUser.displayName || '');
    const [languagePreference, setLanguagePreference] = useState(currentUser.languagePreference || 'en');
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(currentUser.photoURL || null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            // Membuat URL sementara untuk preview
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            let photoURL = currentUser.photoURL;
            // Hanya upload jika ada file baru yang dipilih
            if (selectedFile) {
                const formData = new FormData();
                formData.append('avatar', selectedFile);
                const res = await axios.post(`${BACKEND_URL}/api/users/${currentUser.uid}/avatar`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                photoURL = res.data.photoURL;
            }

            // Update data profil lainnya
            await axios.put(`${BACKEND_URL}/api/users/${currentUser.uid}`, { 
                displayName, 
                languagePreference,
                photoURL // kirim URL baru atau yang lama
            });

            setSuccess(true);
            onProfileUpdate(); // Refresh data pengguna di App.js
            setTimeout(() => closeModal(), 1500);

        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memperbarui profil.');
        } finally {
            setLoading(false);
        }
    };
    
    // Fallback jika tidak ada preview dan displayName kosong
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${displayName || currentUser.email}&background=random&color=fff`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Edit Profil</h2>
                    <button onClick={closeModal}><X className="h-6 w-6 text-gray-400 hover:text-white" /></button>
                </div>
                <form onSubmit={handleUpdate} className="p-4 space-y-4">
                    <div className="flex flex-col items-center">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                        <div className="relative cursor-pointer group" onClick={() => fileInputRef.current.click()}>
                            {/* Logika render gambar yang disempurnakan */}
                            <img src={preview || fallbackAvatar} alt="Preview" className="w-24 h-24 rounded-full object-cover bg-gray-700"/>
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-8 w-8 text-white"/>
                            </div>
                        </div>
                    </div>

                    <InputField label="Nama Tampilan" type="text" value={displayName} onChange={setDisplayName} />
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-300">Bahasa Pilihan</label>
                        <select value={languagePreference} onChange={(e) => setLanguagePreference(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="en">English</option>
                            <option value="id">Indonesia</option>
                            <option value="ja">Japanese</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                        </select>
                    </div>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    {success && <p className="text-sm text-green-400 text-center">Profil berhasil diperbarui!</p>}
                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={closeModal} className="px-4 py-2 mr-2 rounded-md text-gray-300 hover:bg-gray-700">Batal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-500">
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- BAGIAN INI TELAH DIPERBARUI ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
                <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
                <div className="text-gray-300 mb-6">
                    {children}
                </div>
                <div className="flex justify-end gap-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Konfirmasi
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminPage = ({ currentUser, navigateToChat }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const currentFirebaseUser = auth.currentUser;
            if (!currentFirebaseUser) throw new Error("Pengguna tidak terautentikasi.");

            const token = await currentFirebaseUser.getIdToken();
            const response = await axios.get(`${BACKEND_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (err) {
            setError('Gagal memuat data pengguna atau akses ditolak.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const closeModal = () => setModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const handleDeleteUser = async (uid) => {
        closeModal();
        setError('');
        setSuccess('');
        try {
            const token = await auth.currentUser.getIdToken();
            await axios.delete(`${BACKEND_URL}/api/admin/users/${uid}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Pengguna berhasil dihapus.');
            fetchUsers();
        } catch (err) {
            setError('Gagal menghapus pengguna.');
        }
    };

    const handleAdminStatusChange = async (uid, newStatus) => {
        closeModal();
        setError('');
        setSuccess('');
        try {
            const token = await auth.currentUser.getIdToken();
            await axios.put(`${BACKEND_URL}/api/admin/users/${uid}/admin-status`, 
                { isAdmin: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess('Status admin berhasil diubah.');
            setUsers(users.map(u => u.uid === uid ? { ...u, isAdmin: newStatus } : u));
        } catch (err) {
            setError('Gagal mengubah status admin.');
        }
    };
    
    const openDeleteModal = (user) => {
        setModalState({
            isOpen: true,
            title: 'Konfirmasi Penghapusan',
            message: `Apakah Anda yakin ingin menghapus pengguna "${user.displayName}" (@${user.username})? Tindakan ini tidak dapat dibatalkan.`,
            onConfirm: () => handleDeleteUser(user.uid),
        });
    };

    const openAdminToggleModal = (user) => {
        const actionText = user.isAdmin ? "menghapus status admin dari" : "menjadikan admin untuk";
        setModalState({
            isOpen: true,
            title: 'Konfirmasi Perubahan Status',
            message: `Apakah Anda yakin ingin ${actionText} pengguna "${user.displayName}"?`,
            onConfirm: () => handleAdminStatusChange(user.uid, !user.isAdmin)
        });
    }

    return (
        <>
            <ConfirmationModal 
                isOpen={modalState.isOpen}
                onClose={closeModal}
                onConfirm={modalState.onConfirm}
                title={modalState.title}
            >
                {modalState.message}
            </ConfirmationModal>

            <div className="bg-gray-900 text-white p-4 sm:p-6 lg:p-8 h-screen flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Panel Admin</h1>
                    <button onClick={navigateToChat} className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">Kembali ke Chat</button>
                </div>
                {loading && <p>Memuat pengguna...</p>}
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
                {success && <p className="text-green-400 bg-green-900/50 p-3 rounded-md mb-4">{success}</p>}
                
                <div className="flex-1 overflow-x-auto">
                    <div className="align-middle inline-block min-w-full">
                        <div className="shadow overflow-hidden border-b border-gray-700 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pengguna</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                    {users.map(user => (
                                    <tr key={user.uid}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <UserAvatar user={user} size="small" />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">{user.displayName}</div>
                                                    <div className="text-sm text-gray-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">@{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isAdmin ? 'bg-green-200 text-green-800' : 'bg-gray-600 text-gray-200'}`}>
                                                {user.isAdmin ? 'Admin' : 'User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                            <button onClick={() => openAdminToggleModal(user)} className="text-indigo-400 hover:text-indigo-500 disabled:text-gray-500 disabled:cursor-not-allowed" disabled={user.uid === currentUser.uid}>Ubah Status</button>
                                            <button onClick={() => openDeleteModal(user)} className="text-red-400 hover:text-red-500 disabled:text-gray-500 disabled:cursor-not-allowed" disabled={user.uid === currentUser.uid}>Hapus</button>
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default App;
