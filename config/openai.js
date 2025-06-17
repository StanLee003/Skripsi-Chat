// config/openai.js


const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

console.log('✅ OpenAI client siap digunakan.');

module.exports = { openai };