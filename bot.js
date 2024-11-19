require('dotenv').config(); // Load environment variables
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');

const app = express();

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Define Habit Schema
const habitSchema = new mongoose.Schema({
  userId: String, // Telegram user ID
  habit: String,  // Habit description
  createdAt: { type: Date, default: Date.now },
});

const Habit = mongoose.model('Habit', habitSchema);

// Telegram Bot Setup
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('❌ Bot Token is required. Make sure it is defined in your .env file.');
}
const bot = new Telegraf(BOT_TOKEN);

// Command to Add a Habit
bot.command('add', (ctx) => {
  ctx.reply('What habit would you like to add? (Reply with your habit)');
  
  bot.on('text', async (ctx) => {
    try {
      const newHabit = new Habit({
        userId: ctx.from.id,
        habit: ctx.message.text,
      });
      await newHabit.save();
      ctx.reply('✅ Habit added successfully!');
    } catch (err) {
      console.error('Error saving habit:', err);
      ctx.reply('❌ Failed to save your habit. Please try again.');
    }
  });
});

// Command to View Habits
bot.command('view', async (ctx) => {
  try {
    const habits = await Habit.find({ userId: ctx.from.id });
    if (habits.length === 0) {
      ctx.reply('You have no habits saved yet. Use /add to add some!');
    } else {
      const habitList = habits.map((h, index) => `${index + 1}. ${h.habit}`).join('\n');
      ctx.reply(`Here are your habits:\n${habitList}`);
    }
  } catch (err) {
    console.error('Error retrieving habits:', err);
    ctx.reply('❌ Failed to retrieve your habits. Please try again.');
  }
});

// Launch Bot
bot.launch()
  .then(() => console.log('✅ Telegram Bot launched successfully!'))
  .catch((err) => console.error('❌ Telegram Bot launch error:', err));

// Graceful Shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Optional HTTP Server (Required for Render)
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Habit Hero Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Server is running on port ${PORT}`);
});
