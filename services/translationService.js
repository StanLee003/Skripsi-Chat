// services/translationService.js

const { openai } = require('../config/openai');

exports.translateText = async (text, targetLanguage) => {
    if (!text) return "";
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4.1",
            messages: [
                { 
                    role: "system", 
                    content: "Translate the sentences provided by the user into the specified language, ensuring the best choice of words and idiomatic accuracy. You must determine the source language based on the input provided and respond only with the translation, without explanations." 
                },
                { 
                    role: "user", 
                    content: `Translate to ${targetLanguage}: "${text}"` 
                }
            ],
            temperature: 0.3,
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Kesalahan saat translasi:", error);
        return text; // Kembalikan teks asli jika translasi gagal
    }
};