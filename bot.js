const TelegramBot = require('node-telegram-bot-api');

// Replace with your Telegram bot token from BotFather
const token = process.env.token;
const bot = new TelegramBot(token, { polling: true });

// Define the start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Define your project information message
  const message = `Hello! Here’s some information about our projects:
- Project Dolphins: A revolutionary platform that aims to protect marine life.
Click the link below to learn more!

🔗 [Visit Project Dolphins](https://t.me/DolphinsProject_Bot/Dolphins)`;

  // Send message with Markdown formatting for the link
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
    if (msg.text === '/start' || msg.text) {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, "Welcome back! Here’s the project info:\n\n" + message, { parse_mode: 'Markdown' });
    }
  });


  module.exports=bot;