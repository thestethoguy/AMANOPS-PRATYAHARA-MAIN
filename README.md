# 🧘 PRATYAHARA — Your Journey to Mindfulness

<div align="center">

**A full-stack mental wellness companion built for students and mindfulness seekers**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_App-purple?style=for-the-badge)](https://amanops-pratyahara-previous.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=flat-square&logo=google)](https://ai.google.dev)

</div>

---

## 📖 What is Pratyahara?

> *"Pratyahara"* (प्रत्याहार) is the **5th limb of Patanjali's Ashtanga Yoga** — the practice of withdrawing the senses inward, stepping back from external noise to reconnect with your inner self.

This app embodies that philosophy. PRATYAHARA is a personal mindfulness platform that helps users **track moods, journal thoughts, meditate, breathe, and chat with an AI companion** — all in one beautifully designed space.

Whether you're a stressed student, a busy professional, or someone just beginning their mindfulness journey, PRATYAHARA meets you where you are — even without an account, as a Guest.

---

## ✨ Features at a Glance

| Feature | Description | Auth Required |
|---|---|---|
| 🏠 **Dashboard** | Streak tracker, mood stats, quick actions | ✅ |
| 💜 **Mood Check-in** | Log your mood with intensity and notes | ✅ |
| 📖 **Journal** | Write and save private journal entries | ✅ |
| 🧘 **Meditation Timer** | Guided countdown with SVG progress ring | ❌ Guest OK |
| 🌬️ **Breathing Exercise** | Box breathing 4-4-4-4 with animated circle | ❌ Guest OK |
| 📊 **Progress Analytics** | Mood distribution charts and streak stats | ✅ |
| 🤖 **AI Chat** | Multilingual mindfulness assistant (Gemini) | ✅ |
| 🎵 **Media Library** | Curated audio and video meditation content | ❌ Guest OK |
| 👤 **Profile** | Custom display name, password change, biometric | ✅ |
| 👋 **Guest Mode** | Explore the full app without an account | ❌ |
| 🔔 **Daily Reminders** | Browser push notifications (once per 24h) | ✅ |
| 🔐 **Biometric Login** | WebAuthn fingerprint / Face ID / Windows Hello | ✅ |
| 🔑 **Forgot Password** | Self-service password reset by email | ❌ |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              React 18 Frontend  (Vercel CDN)              │  │
│  │                                                           │  │
│  │   ┌──────────┐   ┌──────────┐   ┌─────────────────────┐  │  │
│  │   │  React   │   │  App     │   │    LocalStorage     │  │  │
│  │   │  Router  │   │  State   │   │  token | user       │  │  │
│  │   │  (Pages) │   │  (Auth)  │   │  username | notifs  │  │  │
│  │   └──────────┘   └──────────┘   └─────────────────────┘  │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                             │  HTTP REST via Axios               │
└─────────────────────────────┼───────────────────────────────────┘
                              │  Bearer JWT Token
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FastAPI Backend  (Render)                       │
│                                                                 │
│   /auth/*   /moods   /journal   /chat   /streak   /analytics    │
│   /meditation   /media   ← all API routes in server.py          │
│                                                                 │
│              Motor (Async MongoDB Driver)                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┴─────────────────┐
              ▼                                   ▼
┌─────────────────────────┐       ┌───────────────────────────┐
│    MongoDB Atlas        │       │   Google Gemini Flash     │
│                         │       │   (AI Chat Model)         │
│  users | moods          │       │   gemini-flash-latest     │
│  journals | streaks     │       │   Multilingual support    │
│  chat_messages          │       │   1024 token responses    │
│  meditation_sessions    │       └───────────────────────────┘
│  webauthn_challenges    │
└─────────────────────────┘
```

---

## 🔐 Authentication Flow

```
User Opens App
      │
      ▼
Token in LocalStorage?
      │
   YES│                    NO│
      ▼                      ▼
Load User + inject      Guest Mode active?
saved username            │          │
      │                  YES         NO
      ▼                   │           │
  Full App            Guest          Login
  (Member)           Dashboard        Page
                    (Limited)          │
                                  Choose method:
                              ┌────────┼────────┐
                              │        │        │
                           Email    Biometric  Guest
                            +PW    (WebAuthn)    │
                              │        │         │
                           POST    Challenge   Set guest
                           /login  → Verify    flag in
                              │        │       storage
                              └────┬───┘
                                   │
                              JWT Token
                              (30 days)
                                   │
                              Merge with
                              saved username
                                   │
                              Full App Access
```

---

## 🎯 User Journey

```
First Visit
    │
    ├──► Guest Mode ──────────────────────────────────┐
    │         │                                        │
    │         ├── Try Meditation ✅                    │
    │         ├── Try Breathing ✅                     │
    │         ├── Browse Media ✅                      │
    │         ├── Write Journal (won't save) ⚠️        │
    │         ├── See Chat locked 🔒                   │
    │         └── Sign Up prompt everywhere ──────────┤
    │                                                  │
    └──► Register / Login ◄────────────────────────────┘
              │
              ▼
         Dashboard
         (Streak + Stats)
              │
       ┌──────┼──────┬──────┬──────┐
       ▼      ▼      ▼      ▼      ▼
     Mood  Journal  Med  Breathe  Chat
      Log   Entry  Timer  Guide   (AI)
       │      │      │      │      │
       └──────┴──────┴──────┴──────┘
                     │
                  Streak
                 Updates
                     │
                  Progress
                  Analytics
```

---

## 📦 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.3.1 | UI framework |
| **React Router** | 7.5.1 | Client-side routing |
| **Tailwind CSS** | 3.4.17 | Utility-first styling |
| **shadcn/ui** | Latest | Pre-built UI components |
| **Axios** | 1.8.4 | HTTP requests |
| **Lucide React** | 0.507.0 | Icon library |
| **Recharts** | 3.6.0 | Analytics charts |
| **Framer Motion** | 12.36.0 | Animations |
| **React YouTube** | 10.1.0 | YouTube media player |
| **CRACO** | 7.1.0 | CRA config override |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.110.1 | Python web framework |
| **Motor** | 3.3.1 | Async MongoDB driver |
| **PyJWT** | 2.11.0 | JWT token auth |
| **Passlib + bcrypt** | 1.7.4 | Password hashing |
| **Pydantic** | 2.12.5 | Data validation |
| **Google GenAI** | Latest | Gemini AI chat |
| **Uvicorn** | 0.25.0 | ASGI server |
| **python-dotenv** | 1.2.1 | Environment config |

### Infrastructure
| Service | Purpose |
|---|---|
| **Vercel** | Frontend hosting + global CDN |
| **Render** | Backend Python server hosting |
| **MongoDB Atlas** | Cloud database (free tier) |
| **Google AI Studio** | Gemini Flash API |

---

## 🗄️ Database Schema

```
MongoDB Atlas — database: "pratyahara"
│
├── users
│   ├── id                    UUID string (primary key)
│   ├── email                 string (unique index)
│   ├── username              string (user-set display name)
│   ├── password_hash         bcrypt hash
│   ├── created_at            ISO datetime
│   └── webauthn_credentials  [ { credential_id, public_key, created_at } ]
│
├── moods
│   ├── id, user_id
│   ├── mood_type             Happy | Calm | Anxious | Sad | Grateful | Neutral
│   ├── intensity             integer 1–10
│   ├── note                  optional string
│   └── created_at
│
├── journals
│   ├── id, user_id
│   ├── content               text (free-form)
│   ├── mood_tag              optional string
│   ├── created_at
│   └── updated_at
│
├── streaks
│   ├── id, user_id
│   ├── current_streak        integer (days)
│   ├── longest_streak        integer (days)
│   └── last_activity_date    ISO date string
│
├── meditation_sessions
│   ├── id, user_id
│   ├── duration_minutes      integer
│   ├── session_type          "meditation" | "breathing"
│   ├── rounds_completed      integer (breathing only)
│   └── created_at
│
├── chat_messages
│   ├── id, user_id
│   ├── role                  "user" | "assistant"
│   ├── content               text
│   └── created_at
│
└── webauthn_challenges
    ├── user_id
    ├── challenge             base64url string
    ├── type                  "register" | "login"
    └── created_at
```

---

## 🌐 API Reference

### Auth Routes
```
POST  /api/auth/register                   Register new user
POST  /api/auth/login                      Login (email + password)
POST  /api/auth/forgot-password            Reset password by email
POST  /api/auth/change-password  🔒        Change password (auth)
POST  /api/auth/update-username  🔒        Set custom display name (auth)
POST  /api/auth/webauthn/register-challenge 🔒  Start biometric setup
POST  /api/auth/webauthn/register-verify   🔒  Finish biometric setup
POST  /api/auth/webauthn/login-challenge        Start biometric login
POST  /api/auth/webauthn/login-verify           Finish biometric login
```

### Data Routes (all require 🔒 auth)
```
POST  /api/moods                           Log a mood
GET   /api/moods/history?days=30           Get mood history

POST  /api/journal                         Create journal entry
GET   /api/journal                         Get all entries

GET   /api/streak                          Get current streak
POST  /api/streak/update                   Trigger streak update

POST  /api/meditation                      Save session
GET   /api/meditation/history?days=30      Session history

POST  /api/chat                            Send AI message
GET   /api/chat/history?limit=50           Get chat history

GET   /api/analytics/summary?days=7        Stats summary
```

### Media Routes (public)
```
GET   /api/media/audio                     Audio library
GET   /api/media/videos                    Video library
```

---

## 🤖 AI Chat — How It Works

```
User types message
        │
        ▼
Saved to MongoDB as "user" role
        │
        ▼
Last 20 messages fetched (conversation context)
        │
        ▼
Sent to Gemini Flash API with system prompt:
  ┌────────────────────────────────────────────┐
  │ "You are a compassionate mindfulness       │
  │  assistant for PRATYAHARA. Be warm,        │
  │  empathetic, non-judgmental. Respond in    │
  │  the same language the user writes in.     │
  │  Focus on breathing, meditation, emotions. │
  │  Max 1024 tokens per response."            │
  └────────────────────────────────────────────┘
        │
        ▼
Gemini responds (supports Hindi, Spanish,
English, and many other languages natively)
        │
        ▼
Response saved to MongoDB as "assistant" role
        │
        ▼
Streamed back to user in chat UI
```

---

## 👋 Guest Mode — Access Map

```
┌──────────────────────┬────────────────────────────────────────┐
│      Feature         │  Guest Experience                      │
├──────────────────────┼────────────────────────────────────────┤
│ Dashboard            │ ✅ Shows — no streak or stats cards     │
│ Mood Check-in        │ ✅ Usable — NOT saved to database        │
│ Journal              │ ✅ Writable — NOT saved to database      │
│ Meditation Timer     │ ✅ Fully functional                      │
│ Breathing Exercise   │ ✅ Fully functional                      │
│ Media Library        │ ✅ Fully functional                      │
│ Progress / Analytics │ ⚠️  Empty state with sign-up prompt      │
│ AI Chat              │ 🔒 "Members Only" lock screen            │
│ Profile              │ 🔒 Redirects to home                     │
│ Daily Notifications  │ 🔒 Requires account                      │
└──────────────────────┴────────────────────────────────────────┘
```

A persistent **amber banner** at the top of every guest screen reminds users to sign up. All lock screens include a direct **"Sign Up — It's Free!"** button that clears the guest session and opens the login page.

---

## 🔔 Notification System

```
User toggles ON
       │
       ▼
Browser Permission API
       │
  ┌────┴────┐
Granted    Denied
  │           │
  ▼           ▼
Welcome     Show instructions
 Notif      to unblock in
 fires      browser settings
  │
  ▼
Stored in localStorage:
  pratyahara_notifications_enabled = "true"
  pratyahara_last_notification = timestamp
  │
  ▼
Every time app tab is opened or focused:
  └──► Has 24 hours passed?
          │
       YES│         NO│
          ▼           ▼
    Fire 1 of 5    Stay quiet
    random reminder
    messages
          │
          ▼
    Update last_notification timestamp
```

---

## 🔒 Security Notes

- Passwords are **bcrypt hashed** — never stored in plain text
- JWT tokens expire after **30 days**
- **WebAuthn / FIDO2** biometric auth uses platform authenticators (no passwords sent over the wire)
- CORS restricted to the production Vercel domain
- Username is stored in a **separate localStorage key** (`pratyahara_username`) so it survives login/logout cycles independently of the auth token

---

## 📁 Project Structure

```
AMANOPS-PRATYAHARA-MAIN/
│
├── backend/
│   ├── server.py              # All API routes and business logic
│   └── requirements.txt       # Python package dependencies
│
├── frontend/
│   ├── public/index.html
│   └── src/
│       ├── App.js             # Root — routing, auth state, guest mode
│       ├── App.css            # Global styles + breathing animation keyframes
│       ├── index.js
│       └── components/
│           ├── Login.js       # Login / Register / Forgot PW / Biometric
│           ├── Navbar.js      # Top nav (adapts for guest vs member)
│           ├── Dashboard.js   # Home — streak, stats, quick actions
│           ├── MoodCheckIn.js # 6-option mood selector
│           ├── Journal.js     # Journal editor + history list
│           ├── Meditation.js  # Timer with animated SVG ring
│           ├── Breathing.js   # Box breathing with animated circle
│           ├── Analytics.js   # Recharts mood charts + streak stats
│           ├── Chat.js        # Real-time AI chat UI
│           ├── MediaPlayer.js # Audio/video library with embedded player
│           └── Profile.js     # Profile / Security / Settings tabs
│
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.10+
- MongoDB Atlas account (free tier works)
- Google AI Studio API key (free)

### 1. Clone the repo
```bash
git clone https://github.com/thestethoguy/AMANOPS-PRATYAHARA-MAIN
cd AMANOPS-PRATYAHARA-MAIN
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your values
MONGO_URL=mongodb+srv://your_connection_string
DB_NAME=pratyahara
JWT_SECRET=your_super_secret_key_here
GEMINI_API_KEY=your_google_ai_key
RP_ID=localhost
CORS_ORIGINS=http://localhost:3000

# Start server
uvicorn server:app --reload --port 8001
# API docs available at: http://localhost:8001/docs
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
yarn install

# Create .env
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Start app
yarn start
# Opens at: http://localhost:3000
```

---

## ☁️ Production Deployment

```
Developer pushes to GitHub (main branch)
              │
       ┌──────┴───────┐
       │               │
       ▼               ▼
   Vercel           Render
  (Frontend)       (Backend)
       │               │
  Auto-triggers    Manual Deploy
  build pipeline   (or configure
       │           auto-deploy)
       │               │
  React app        FastAPI server
  built + CDN      starts on port
  distributed      assigned by Render
       │               │
       └───────┬───────┘
               │
               ▼
         MongoDB Atlas
         (always running,
          no deploy needed)
```

### Environment Variables

**Render (Backend):**
```
MONGO_URL      = mongodb+srv://...
DB_NAME        = pratyahara
JWT_SECRET     = <strong-random-string>
GEMINI_API_KEY = <from-google-ai-studio>
RP_ID          = amanops-pratyahara-previous.vercel.app
CORS_ORIGINS   = https://amanops-pratyahara-previous.vercel.app
```

**Vercel (Frontend):**
```
REACT_APP_BACKEND_URL = https://your-render-service.onrender.com
```

> ⚠️ **Render Free Tier Note:** The server spins down after 15 minutes of inactivity. The first request after idle takes 30–60 seconds (cold start). Use a ping service like UptimeRobot to keep it awake.

---

## 🗺️ Roadmap

- [ ] Service Worker for background push notifications
- [ ] Dark mode theme toggle
- [ ] Language preference selector for the AI chat
- [ ] Data export — download journals and mood history as PDF/CSV
- [ ] Meditation session history visualisation page
- [ ] Email-based daily reminders as a fallback
- [ ] React Native mobile app
- [ ] Social milestones — share streaks with friends

---

## 👨‍💻 Author

**Aman Aaryan\n** — [@thestethoguy](https://github.com/thestethoguy)
**Raman Kurmi\n**
**Alakesh Chetia\n**
**Siddhant Singh\n**

Built from scratch as a team full-stack project exploring React, FastAPI, MongoDB, WebAuthn, and AI integration — all in a single cohesive wellness product.

---

<div align="center">

*"The quieter you become, the more you are able to hear."* — Rumi

**⭐ Star this repo if PRATYAHARA brought you a moment of peace!**

</div>
