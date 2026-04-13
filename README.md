📘 AI Doubt Solver (Full Stack AI Tutor)














🚀 Overview

AI Doubt Solver is a full-stack AI-powered learning assistant that helps students solve academic doubts using:

✍️ Text input
🖼️ Image input (handwritten/textbook problems)
🎙️ Voice input

It uses Groq LLaMA models + AssemblyAI + MongoDB to deliver instant step-by-step explanations like a real tutor.

📸 Screenshots

Replace these with your actual screenshots (important for resume & LinkedIn)

🏠 Landing Page

📊 Dashboard

💬 Chat Interface

🖼️ Image Doubt Solving

🎙️ Voice Doubt Solving

✨ Features
🔐 JWT Authentication (Login/Register)
💬 Multi-chat system per user
🧠 AI-powered step-by-step explanations
🖼️ Image-based problem solving (Vision AI)
🎙️ Voice-based doubt solving (Speech-to-text)
📚 Auto subject detection
💾 MongoDB chat history storage
⚡ Optimistic UI updates
📊 Dashboard analytics (chat stats)
📱 Responsive UI (mobile + desktop)
🏗️ Tech Stack
Frontend
React (Vite)
Tailwind CSS
React Router DOM
Axios
React Markdown
React Hot Toast
Lucide Icons
Backend
Node.js
Express.js
MongoDB + Mongoose
JWT Authentication
Multer (file uploads)
bcryptjs
AI Services
🧠 Groq API (LLaMA 3 & Vision models)
🎙️ AssemblyAI (Speech-to-text)
📁 Project Structure
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
⚙️ Setup Instructions
1️⃣ Clone Repo
git clone https://github.com/your-username/ai-doubt-solver.git
cd ai-doubt-solver
2️⃣ Backend Setup
cd server
npm install
Create .env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
GROQ_API_KEY=your_groq_key
ASSEMBLYAI_API_KEY=your_assemblyai_key
NODE_ENV=development
Run Backend
npm run dev
3️⃣ Frontend Setup
cd client
npm install
npm run dev
🔗 API Endpoints
Auth
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
Chats
GET    /api/chats
POST   /api/chats
GET    /api/chats/:id
DELETE /api/chats/:id
GET    /api/chats/stats
AI Doubts
POST /api/chats/:id/text
POST /api/chats/:id/image
POST /api/chats/:id/voice
🧠 AI Workflow
User Input (Text/Image/Voice)
        ↓
Backend API (Express)
        ↓
Groq / AssemblyAI Processing
        ↓
AI Response (Step-by-step tutor answer)
        ↓
MongoDB Storage
        ↓
Frontend UI Update
📈 Future Enhancements
📄 Export chats as PDF
⭐ Bookmark important answers
🧠 AI quiz generator mode
📊 Learning analytics dashboard
🌙 Dark mode improvements
⚡ Redis caching for faster responses
👨‍💻 Author

Bhanu Prakash
Full Stack Developer | AI Enthusiast

📜 License

This project is licensed under the MIT License.