# DocuChat AI

> Upload any PDF and chat with it using AI — powered by RAG (Retrieval Augmented Generation)

![Tech Stack](https://img.shields.io/badge/Python-FastAPI-blue) ![React](https://img.shields.io/badge/Frontend-React-61dafb) ![MongoDB](https://img.shields.io/badge/Database-MongoDB-green) ![Redis](https://img.shields.io/badge/Cache-Redis-red)

## What is this?

DocuChat AI lets users upload PDF documents and ask questions about them in natural language. The AI answers based strictly on the document content — not from general knowledge.

**Example:** Upload your economics textbook → Ask "What is the Solow Growth Model?" → Get a precise answer from your document instantly.

## Demo

- Upload a PDF
- Ask any question about it
- Get AI-powered answers in seconds

## Architecture

User → React Frontend → FastAPI Backend → RAG Pipeline → Groq LLM
↓                ↓
MongoDB          ChromaDB
Redis            (vectors)
(cache/sessions)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + React Router | User interface |
| Backend | FastAPI + Python | REST API server |
| AI Pipeline | LangChain + Groq LLM | RAG implementation |
| Embeddings | sentence-transformers | Text to vectors |
| Vector Store | ChromaDB | Semantic search |
| Database | MongoDB | Users, docs, chat history |
| Cache | Redis | Sessions, rate limiting |
| Container | Docker Compose | One command setup |

## Key Engineering Decisions

**Why RAG instead of fine-tuning?**
RAG retrieves relevant chunks at query time — no training needed, works with any document instantly, and answers stay grounded in the actual document content.

**Why ChromaDB?**
Lightweight vector store that runs locally with no external API. Each document gets its own collection, keeping user data isolated.

**Why Redis for rate limiting?**
Redis INCR is atomic — no race conditions when multiple requests hit simultaneously. Combined with EXPIRE, it creates a sliding window rate limiter in 3 lines of code.

**Why Groq?**
Groq's LPU inference is significantly faster than standard GPU inference — responses feel instant compared to other free LLM APIs.

## Quick Start

### Prerequisites
- Docker Desktop
- Python 3.11+
- Node.js 20+
- Groq API key (free at console.groq.com)

### Run locally

**1. Clone the repo:**
```bash
git clone https://github.com/samarthsatpute08/docuchat-ai.git
cd docuchat-ai
```

**2. Start MongoDB and Redis:**
```bash
docker compose up -d
```

**3. Start backend:**
```bash
python -m venv venv
source venv/bin/activate
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**4. Start frontend:**
```bash
cd frontend
npm install
npm start
```

**5. Open** http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /register | Create account |
| POST | /login | Get JWT token |
| POST | /upload | Upload PDF |
| POST | /chat | Ask question about PDF |
| GET | /history/{doc_id} | Get chat history |
| GET | /documents | List all documents |

## Features

- JWT authentication with Redis session storage
- PDF upload with automatic chunking and indexing
- Semantic search using sentence embeddings
- Conversation history saved to MongoDB
- Rate limiting — 10 requests per minute per user
- Drag and drop PDF upload
- Chat history loads when you revisit a document

## What I Learned

- Building end-to-end RAG pipelines with LangChain
- Vector embeddings and semantic similarity search
- Async Python with FastAPI and Motor (async MongoDB)
- Redis patterns — caching, rate limiting, session storage
- Containerizing multi-service apps with Docker Compose