# 🧠 AI Scribe — Meeting Recorder & Summarizer

AI Scribe is a backend service that automatically joins online meetings, records them, transcribes the audio, and generates structured summaries. It also stores meeting history securely for later access.

---

## 🚀 Features

* 🤖 Auto-join meetings using Recall.ai bots
* 🎙️ Record and process meeting audio
* 📝 Accurate transcription (Groq Whisper / OpenAI Whisper)
* 📊 Structured AI-generated summaries
* 💬 Extract chat messages from meetings
* ☁️ Store summaries & transcripts in AWS S3
* 🔐 User-based history isolation

---

## 🛠️ Tech Stack

* **FastAPI** — Backend framework
* **Recall.ai** — Meeting bot & recording
* **Groq / OpenAI Whisper** — Speech-to-text
* **OpenAI / HuggingFace (gpt-oss-120b)** — Summarization
* **AWS S3** — Storage
* **httpx / asyncio** — Async API handling

---

## ⚙️ Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd ai-scribe
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file:

```env
# AI APIs
OPENAI_API_KEY=your_key
GROQ_API_KEY=your_key
HF_API_KEY=your_key

# Recall.ai
RECALL_API_KEY=your_key

# AWS S3 (optional but recommended)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket

# Feature flags
ENABLE_HISTORY_STORAGE=true
```

---

## ▶️ Run the Server

```bash
python server.py
```

Server will start at:

```
http://127.0.0.1:3000
```

---

## 📡 API Endpoints

### 🔹 Start Meeting Recording (SSE)

```
GET /start?meetLink=...&username=...&uid=...
```

Streams real-time updates:

* Bot joining
* Recording status
* Transcription
* Summary

---

### 🔹 Leave Meeting

```
POST /bot/{bot_id}/leave
```

---

### 🔹 Get Bot Status

```
GET /bot/{bot_id}
```

---

### 🔹 List Summaries

```
GET /summaries?uid=USER_ID
```

---

### 🔹 Get Specific Summary

```
GET /summaries/{key}?uid=USER_ID
```

---

### 🔹 Rename Summary

```
PATCH /summaries/{key}/rename
```

---

### 🔹 Health Check

```
GET /health
```

---

## 🔐 Notes

* `uid` is required for all history-related APIs
* Each user’s data is securely isolated in S3
* If S3 is not configured, summaries won’t be stored

---

## 📌 How It Works

1. User provides meeting link
2. Recall.ai bot joins the meeting
3. Audio is recorded and processed
4. Whisper transcribes the audio
5. LLM generates structured summary
6. Data is optionally stored in AWS S3

---

## 🧩 Future Improvements

* Speaker diarization (who said what)
* Real-time transcription
* Frontend dashboard
* Multi-language support

---

## 📄 License

This project is for educational and personal use. Modify as needed.

---

## 🙌 Acknowledgements

* Recall.ai
* OpenAI
* Groq
* HuggingFace
* FastAPI
