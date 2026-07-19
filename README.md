# Vision Assistant

A Next.js 14 app with a mobile-friendly camera capture component for vision-based assistance.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. For camera access on a phone, use your machine's local network IP (e.g. `http://192.168.x.x:3000`) — HTTPS or localhost is required for `getUserMedia`.

## Features

- Live rear-camera preview via `getUserMedia`
- Capture frames as base64 JPEG images
- Mobile-responsive layout optimized for phones
