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
  const filter = { user: req.user._id, isArchived: false };
  if (req.query.subject && req.query.subject !== 'All') {
    filter.subject = req.query.subject;
  }

  const chats = await Chat.find(filter)
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

  res.json({ chats: chatSummaries });
};

// ─────────────────────────────
// GET SINGLE CHAT
// ─────────────────────────────
const getChatById = async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
  res.json({ chat });
};

// ─────────────────────────────
// CREATE CHAT
// ─────────────────────────────
const createChat = async (req, res) => {
  const chat = await Chat.create({
    user: req.user._id,
    title: req.body.title || 'New Chat',
    subject: req.body.subject || 'General',
  });

  res.status(201).json({ chat });
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

  const userMessage = chat.messages[chat.messages.length - 2];
  const assistantMessage = chat.messages[chat.messages.length - 1];

  res.json({ userMessage, assistantMessage, subject: chat.subject });
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

    const userMessage = chat.messages[chat.messages.length - 2];
    const assistantMessage = chat.messages[chat.messages.length - 1];

    res.json({ userMessage, assistantMessage, subject: chat.subject });
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

  const userMessage = chat.messages[chat.messages.length - 2];
  const assistantMessage = chat.messages[chat.messages.length - 1];

  res.json({ userMessage, assistantMessage, transcript, subject: chat.subject });
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// BOOKMARK MESSAGE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const setMessageBookmark = async (req, res) => {
  const { chatId, messageId } = req.params;
  const { isBookmarked } = req.body || {};

  const chat = await Chat.findOne({ _id: chatId, user: req.user._id });
  if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

  const msg = chat.messages.id(messageId);
  if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
  if (msg.role !== 'assistant') {
    return res.status(400).json({ success: false, message: 'Only AI answers can be bookmarked' });
  }

  if (typeof isBookmarked === 'boolean') msg.isBookmarked = isBookmarked;
  else msg.isBookmarked = !msg.isBookmarked;

  await chat.save();
  res.json({ message: msg });
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET BOOKMARKS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getBookmarks = async (req, res) => {
  const chats = await Chat.find({
    user: req.user._id,
    'messages.isBookmarked': true,
  }).select('title subject messages createdAt updatedAt');

  const bookmarks = [];
  for (const chat of chats) {
    for (const msg of chat.messages) {
      if (!msg.isBookmarked || msg.role !== 'assistant') continue;
      bookmarks.push({
        chatId: chat._id,
        chatTitle: chat.title,
        chatSubject: chat.subject,
        messageId: msg._id,
        role: msg.role,
        content: msg.content,
        inputType: msg.inputType,
        timestamp: msg.timestamp,
      });
    }
  }

  bookmarks.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  res.json({ bookmarks });
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
  const totalChats = await Chat.countDocuments({ user: req.user._id, isArchived: false });

  const breakdown = await Chat.aggregate([
    { $match: { user: req.user._id, isArchived: false } },
    { $group: { _id: '$subject', count: { $sum: 1 } } },
  ]);

  const subjectBreakdown = breakdown.reduce((acc, row) => {
    acc[row._id || 'General'] = row.count;
    return acc;
  }, {});

  res.json({
    stats: {
      totalChats,
      totalDoubts: req.user.totalDoubts || 0,
      subjectBreakdown,
    },
  });
};

module.exports = {
  getChats,
  getChatById,
  createChat,
  askTextDoubt,
  askImageDoubt,
  askVoiceDoubt,
  setMessageBookmark,
  getBookmarks,
  deleteChat,
  getStats,
};
