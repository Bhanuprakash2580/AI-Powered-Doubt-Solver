const Chat = require('../models/Chat');
const User = require('../models/User');
const fs = require('fs');

const {
  solveTextDoubt,
  solveImageDoubt,
  solveVoiceDoubt,
  detectSubject,
} = require('../services/geminiService');

const { transcribeAudio } = require('../services/speechService');

// ─────────────────────────────
// GET ALL CHATS
// ─────────────────────────────
const getChats = async (req, res) => {
  const chats = await Chat.find({ user: req.user._id, isArchived: false })
    .select('title subject lastActivity createdAt updatedAt messages')
    .sort({ lastActivity: -1 });

  const chatSummaries = chats.map((chat) => ({
    _id: chat._id,
    title: chat.title,
    subject: chat.subject,
    lastActivity: chat.lastActivity,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messageCount: chat.messages.length,
    lastMessage: chat.messages.length ? chat.messages[chat.messages.length - 1].content : '',
  }));

  res.json(chatSummaries);
};

// ─────────────────────────────
// GET SINGLE CHAT
// ─────────────────────────────
const getChatById = async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
  res.json(chat);
};

// ─────────────────────────────
// CREATE CHAT
// ─────────────────────────────
const createChat = async (req, res) => {
  const chat = await Chat.create({
    user: req.user._id,
    title: req.body.title || 'New Chat',
  });

  res.status(201).json(chat);
};

// ─────────────────────────────
// ASK TEXT DOUBT
// ─────────────────────────────
const askTextDoubt = async (req, res) => {
  const { question, subject } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ success: false, message: 'Question is required' });
  }

  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

  const chatHistory = chat.messages.slice();
  const chatSubject = subject && subject !== 'General' ? subject : (chat.subject || 'General');

  chat.messages.push({ role: 'user', content: question, inputType: 'text' });

  const answer = await solveTextDoubt(question, chatSubject, chatHistory);
  chat.messages.push({ role: 'assistant', content: answer, inputType: 'text' });

  if (chat.subject === 'General') {
    const detected = subject && subject !== 'General' ? subject : detectSubject(question);
    if (detected) chat.subject = detected;
  }

  await chat.save();
  await User.findByIdAndUpdate(req.user._id, { $inc: { totalDoubts: 1 } });

  res.json({ success: true, messages: chat.messages.slice(-2) });
};

// ─────────────────────────────
// ASK IMAGE DOUBT
// ─────────────────────────────
const askImageDoubt = async (req, res) => {
  const imagePath = req.file?.path;
  const imageUrl = req.file?.filename ? `/uploads/images/${req.file.filename}` : null;
  const { question = '', subject } = req.body;

  if (!imagePath) {
    return res.status(400).json({ success: false, message: 'Image file is required' });
  }

  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

  const chatHistory = chat.messages.slice();
  const chatSubject = subject && subject !== 'General' ? subject : (chat.subject || 'General');

  try {
    chat.messages.push({
      role: 'user',
      content: question?.trim() ? question : 'Image doubt',
      inputType: 'image',
      imageUrl,
    });

    const answer = await solveImageDoubt(imagePath, question, chatSubject);
    chat.messages.push({ role: 'assistant', content: answer, inputType: 'image' });

    if (chat.subject === 'General') {
      const detected = subject && subject !== 'General'
        ? subject
        : detectSubject(question || 'Image analysis');
      if (detected) chat.subject = detected;
    }

    await chat.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalDoubts: 1 } });

    res.json({ success: true, messages: chat.messages.slice(-2) });
  } catch (err) {
    try {
      fs.unlinkSync(imagePath);
    } catch {}
    throw err;
  }
};

// ─────────────────────────────
// ASK VOICE DOUBT
// ─────────────────────────────
const askVoiceDoubt = async (req, res) => {
  const audioPath = req.file?.path;
  const voiceUrl = req.file?.filename ? `/uploads/audio/${req.file.filename}` : null;
  const { subject } = req.body;

  if (!audioPath) {
    return res.status(400).json({ success: false, message: 'Audio file is required' });
  }

  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

  const chatHistory = chat.messages.slice();
  const chatSubject = subject && subject !== 'General' ? subject : (chat.subject || 'General');

  const transcript = await transcribeAudio(audioPath);

  chat.messages.push({
    role: 'user',
    content: transcript || 'Voice doubt',
    inputType: 'voice',
    voiceUrl,
    transcript,
  });

  const answer = await solveVoiceDoubt(transcript, chatSubject, chatHistory);
  chat.messages.push({ role: 'assistant', content: answer, inputType: 'voice' });

  if (chat.subject === 'General') {
    const detected = subject && subject !== 'General' ? subject : detectSubject(transcript || 'Voice');
    if (detected) chat.subject = detected;
  }

  await chat.save();
  await User.findByIdAndUpdate(req.user._id, { $inc: { totalDoubts: 1 } });

  res.json({ success: true, messages: chat.messages.slice(-2) });
};

// ─────────────────────────────
// DELETE CHAT
// ─────────────────────────────
const deleteChat = async (req, res) => {
  const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
  res.json({ message: 'Chat deleted' });
};

// ─────────────────────────────
// STATS
// ─────────────────────────────
const getStats = async (req, res) => {
  const totalChats = await Chat.countDocuments({ user: req.user._id });
  res.json({ totalChats, totalDoubts: req.user.totalDoubts || 0 });
};

module.exports = {
  getChats,
  getChatById,
  createChat,
  askTextDoubt,
  askImageDoubt,
  askVoiceDoubt,
  deleteChat,
  getStats,
};

