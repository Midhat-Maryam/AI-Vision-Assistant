# Nazar AI — Multimodal Vision Assistant for the Blind

**Live Demo:** [ai-vision-assistant-xi.vercel.app](https://ai-vision-assistant-xi.vercel.app/)

A voice-first, multimodal AI assistant designed for blind and low-vision users. Point your phone's camera at anything, and Nazar AI describes the scene, reads text aloud, identifies currency, and reads product labels — all through natural speech, with no visual interface dependency.

---
## ✨ Features

| Feature | Description |
|---|---|
| 🗣️ **Voice-First Interaction** | Every feature is accessible by voice — no need to see or find buttons |
| 👁️ **Scene Description** | Point the camera and get a concise, spoken description of your surroundings |
| ⚠️ **Hazard Detection** | Automatically flags obstacles, stairs, and hazards, with a vibration + visual alert |
| 💵 **Currency Recognition** | Identifies Pakistani banknote denominations for independent shopping |
| 🏷️ **Product & Label Reading** | Reads medicine labels, expiry dates, dosage instructions, and warnings aloud |
| 🎤 **Voice Q&A** | Ask follow-up questions like "what color is this?" using natural speech |
| 🔊 **Auto Text-to-Speech** | Every response is automatically spoken aloud |
| 🗣️ **Voice-Based Mode Switching** | Say "check currency" or "read label" — no need to tap a screen at all |

## 🧠 Why This Is Multimodal

Nazar AI combines three distinct data modalities in a single pipeline:

1. **Vision** — a live camera frame is captured and interpreted by a vision-language model
2. **Language** — the model reasons about the image and generates natural-language output
3. **Speech** — Speech-to-Text captures spoken questions, and Text-to-Speech delivers every response aloud

This creates a fully hands-free, screen-independent experience — critical for a genuinely accessible tool.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Vision-Language Model:** Qwen 3.6 (via Groq API)
- **Speech:** Web Speech API (Speech-to-Text + Text-to-Speech, browser-native)
- **Deployment:** Vercel

## 🏗️ Architecture

```
📷 Camera captures frame
        ↓
🎙️ (Optional) Voice question captured via Speech-to-Text
        ↓
🧠 Frame + query sent to /api/analyze
        ↓
🤖 Groq Vision-Language Model (Qwen 3.6) analyzes image
        ↓
📦 Structured JSON response (description, hazard flag)
        ↓
🔊 Text-to-Speech reads the response aloud
        ↓
📳 Vibration + visual alert if a hazard is detected
```

## 🚀 Getting Started (Local Development)

```bash
git clone https://github.com/Midhat-Maryam/AI-Vision-Assistant.git
cd AI-Vision-Assistant
npm install
```

Create a `.env.local` file in the root directory:
```
GROQ_API_KEY=your_groq_api_key_here
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — note that camera access requires either `localhost` or HTTPS.

## 🧪 Modes

- **General** — describes the scene naturally, prioritizing hazards
- **💵 Currency** — identifies Pakistani banknote denominations
- **🏷️ Label** — reads product/medicine labels, expiry dates, and dosage instructions

Switch modes by voice — just say "check currency" or "read label" when asking a question.

## ⚠️ Known Limitations & Roadmap

Being transparent about current constraints and what's next:

- **Currency recognition accuracy** — currently relies on a general-purpose vision model rather than a fine-tuned classifier. A dedicated model (e.g. a lightweight CNN trained specifically on Pakistani currency) would improve reliability for production use.
- **API rate limits** — free-tier vision APIs impose token limits, which constrains continuous/real-time scanning. A production version would use an on-device model (e.g. TensorFlow.js) for instant, unlimited hazard scanning.
- **Language support** — currently English-only. Urdu and Sindhi text-to-speech support is planned, pending access to a reliable, low-cost TTS provider that supports these languages well.
- **Object detection** — future versions could integrate a dedicated real-time object detection model (e.g. YOLOv8) for lower-latency hazard alerts.
- **Emergency features** — a planned SOS mode using MCP (Model Context Protocol) could automatically alert a trusted contact via WhatsApp/SMS with location and hazard context during urgent situations.

---

