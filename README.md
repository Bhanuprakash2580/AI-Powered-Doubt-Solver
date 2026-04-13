# 📘 AI Doubt Solver (Full Stack AI Tutor)

![Node](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-Vite-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![AI](https://img.shields.io/badge/AI-Groq%20%2B%20AssemblyAI-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Overview

AI Doubt Solver is a full-stack AI-powered web application that helps students solve academic doubts instantly using:

- ✍️ Text input  
- 🖼️ Image input (handwritten/textbook questions)  
- 🎙️ Voice input  

It uses **Groq LLaMA AI + AssemblyAI + MongoDB** to generate step-by-step explanations like a real tutor.

---

## 📸 Screenshots

> Replace with your real screenshots

### 🏠 Landing Page
![Landing](https://via.placeholder.com/900x450?text=Landing+Page)

### 📊 Dashboard
![Dashboard](https://via.placeholder.com/900x450?text=Dashboard)

### 💬 Chat Screen
![Chat](https://via.placeholder.com/900x450?text=Chat+Interface)

---

## ✨ Features

- 🔐 JWT Authentication (Login/Register)
- 💬 Multi-chat system
- 🧠 AI step-by-step explanations
- 🖼️ Image-based problem solving (Vision AI)
- 🎙️ Voice-based doubt solving
- 📚 Subject auto-detection
- 💾 MongoDB chat history
- ⚡ Optimistic UI updates
- 📊 Dashboard analytics

---

## 🏗️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios
- React Router DOM
- React Markdown
- React Hot Toast
- Lucide Icons

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer
- bcryptjs

### AI Services
- Groq API (LLaMA 3 & Vision)
- AssemblyAI (Speech-to-text)

---

## 📁 Project Structure

```
ai-doubt-solver/
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── server.js
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/ai-doubt-solver.git
cd ai-doubt-solver
```

---

### 2️⃣ Backend Setup

```bash
cd server
npm install
```

Create `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
GROQ_API_KEY=your_groq_key
ASSEMBLYAI_API_KEY=your_assemblyai_key
NODE_ENV=development
```

Run backend:

```bash
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd client
npm install
npm run dev
```

---

## 🔗 API Endpoints

### Auth

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Chats

```
GET    /api/chats
POST   /api/chats
GET    /api/chats/:id
DELETE /api/chats/:id
GET    /api/chats/stats
```

### AI Doubts

```
POST /api/chats/:id/text
POST /api/chats/:id/image
POST /api/chats/:id/voice
```

---

## 🧠 Architecture Flow

```
User Input (Text/Image/Voice)
        ↓
Express Backend API
        ↓
Groq AI / AssemblyAI
        ↓
AI Response (Step-by-step explanation)
        ↓
MongoDB Storage
        ↓
React Frontend UI Update
```

---

## 🔥 Future Improvements

- 📄 Export chat as PDF
- ⭐ Bookmark answers
- 🧠 AI quiz generator
- 📊 Learning analytics dashboard
- 🌙 Dark mode
- ⚡ Redis caching

---

## 👨‍💻 Author

**Bhanu Prakash**  
Full Stack Developer | AI Enthusiast

---

## 📜 License

This project is licensed under the MIT License.
