# TaskFlow Pro

> Dependency-Aware Workflow and DAG Scheduling Engine

TaskFlow Pro is a smart project and task management system that manages task dependencies, detects circular workflows, calculates READY/BLOCKED states, and provides AI-powered workflow suggestions.

Built for **Contata Hackathon 2026**.

## 🚀 Features

* 📊 Project dashboard
* 📋 Kanban task management
* 🔗 Task dependency management
* 🔄 DAG-based workflow validation
* 🚫 Circular dependency prevention
* 🟢 READY / 🔴 BLOCKED task states
* 🔀 Multi-level dependency propagation
* 📅 Schedule propagation
* 🕸️ Dependency graph visualization
* ✨ Gemini-powered AI suggestions
* ✅ Accept / ❌ Reject AI recommendations
* 🌙 Dark-mode interface

## 🏗️ Architecture

```text
Next.js + React
       │
       │ REST API
       ▼
Node.js + Express
       │
 ┌─────┼─────────────┐
 │     │             │
Task  DAG Engine   AI Service
 │     │             │
 └─────┼─────────────┘
       │             │
       ▼             ▼
     MySQL        Gemini API
```

## 🛠️ Tech Stack

**Frontend**

* Next.js 16
* React
* Tailwind CSS v4

**Backend**

* Node.js
* Express.js
* REST API

**Database**

* MySQL
* mysql2

**AI**

* Google Gemini API

## 📂 Project Structure

```text
TaskFlow-Pro/
├── frontend/
├── backend/
├── docs/
│   └── DESIGN.md
├── README.md
└── .gitignore
```

## ⚙️ Setup

### 1. Clone

```bash
git clone https://github.com/Rachit-0001/TaskFlow-Pro.git
cd TaskFlow-Pro
```

### 2. Backend

```bash
cd backend
npm install
```

Create `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taskflow_pro
DB_PORT=3306
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

Start backend:

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 🔄 Dependency Example

```text
Requirements Analysis
          │
          ▼
     System Design
          │
          ▼
  Backend Development
          │
          ▼
       Testing
```

If an upstream task is incomplete, dependent tasks can become **BLOCKED**. Once dependencies are completed, downstream tasks can become **READY**.

## 🤖 AI Workflow

```text
Select Task
     │
     ▼
Generate Suggestion
     │
     ▼
Gemini API
     │
     ▼
Review Suggestion
   /       \
Accept    Reject
```

## 📖 Documentation

Detailed architecture, database design, DAG engine, API flow, AI architecture, and known limitations:

`docs/DESIGN.md`

## 👨‍💻 Author

**Rachit Gangwar**
B.Tech CSE (Artificial Intelligence)
NIET, Greater Noida

## 📜 License

Built for educational, hackathon, and portfolio purposes.
