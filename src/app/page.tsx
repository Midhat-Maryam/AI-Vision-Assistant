"use client";

import { useState, useEffect, useRef } from "react";
import CameraCapture from "@/components/CameraCapture";

export default function Home() {
  const [description, setDescription] = useState("");
  const [hasHazard, setHasHazard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captureMode, setCaptureMode] = useState<"general" | "currency" | "product">("general");
  const [isListening, setIsListening] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState("");
  const [pulseActive, setPulseActive] = useState(false);
  const lastImageRef = useRef<string>("");
  const hasGreetedRef = useRef(false);

  useEffect(() => {
    function greetOnce() {
      if (hasGreetedRef.current) return;
      hasGreetedRef.current = true;

      speakText(
        "Nazar AI is ready. Tap the microphone and ask a question, say check currency to identify money, or say read label for products and medicine. Otherwise, tap capture for a general description."
      );

      document.removeEventListener("click", greetOnce);
      document.removeEventListener("touchstart", greetOnce);
    }

    document.addEventListener("click", greetOnce);
    document.addEventListener("touchstart", greetOnce);

    return () => {
      document.removeEventListener("click", greetOnce);
      document.removeEventListener("touchstart", greetOnce);
    };
  }, []);

  useEffect(() => {
    if (description) {
      speakText(description);
    }
  }, [description]);

  function speakText(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }

  function triggerHazardAlert() {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    setPulseActive(true);
    setTimeout(() => setPulseActive(false), 1000);
  }

  function detectModeFromSpeech(transcript: string): "general" | "currency" | "product" {
    const lower = transcript.toLowerCase();

    if (
      lower.includes("currency") ||
      lower.includes("money") ||
      lower.includes("note") ||
      lower.includes("rupee") ||
      lower.includes("cash")
    ) {
      return "currency";
    }

    if (
      lower.includes("label") ||
      lower.includes("medicine") ||
      lower.includes("expiry") ||
      lower.includes("expire") ||
      lower.includes("dosage") ||
      lower.includes("ingredient") ||
      lower.includes("product")
    ) {
      return "product";
    }

    return "general";
  }

  async function analyzeImage(base64: string, query: string = "", modeOverride?: "general" | "currency" | "product") {
    setLoading(true);
    setError("");
    setDescription("");
    setHasHazard(false);
    lastImageRef.current = base64;

    const effectiveMode = modeOverride || captureMode;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mode: effectiveMode, query }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setDescription(data.description);
        setHasHazard(data.hasHazard);

        if (data.hasHazard) {
          triggerHazardAlert();
        }
      }
    } catch (err) {
      setError("Failed to analyze image. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleCapture(base64: string) {
    analyzeImage(base64);
  }

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Voice input not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceQuery(transcript);

      const detectedMode = detectModeFromSpeech(transcript);
      setCaptureMode(detectedMode);

      if (lastImageRef.current) {
        analyzeImage(lastImageRef.current, transcript, detectedMode);
      } else {
        setError("Capture a photo first, then ask your question.");
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setError("Voice recognition failed. Try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  return (
    <main
      className={`mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6 sm:px-6 transition-colors duration-300 ${
        pulseActive ? "bg-red-950" : ""
      }`}
    >
      <header className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Nazar AI
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Point your camera and capture a frame
        </p>
      </header>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setCaptureMode("general")}
          aria-label="General description mode"
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            captureMode === "general" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
        >
          General
        </button>
        <button
          onClick={() => setCaptureMode("currency")}
          aria-label="Currency recognition mode"
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            captureMode === "currency" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
        >
          💵 Currency
        </button>
        <button
          onClick={() => setCaptureMode("product")}
          aria-label="Product and label reading mode"
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            captureMode === "product" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
        >
          🏷️ Label
        </button>
      </div>
      <p className="mb-3 text-center text-xs text-white/40">
        Current mode: {captureMode} (say "check currency" or "read label" to switch by voice)
      </p>

      <CameraCapture onCapture={handleCapture} />

      <button
        onClick={startListening}
        disabled={isListening}
        aria-label="Ask a question by voice"
        className={`mt-3 w-full rounded-lg py-3 text-sm font-medium ${
          isListening ? "bg-red-600 text-white" : "bg-white/10 text-white"
        }`}
      >
        {isListening ? "🎙️ Listening..." : "🎤 Ask a Question"}
      </button>

      {voiceQuery && (
        <p className="mt-2 text-center text-xs text-white/40">
          You asked: "{voiceQuery}"
        </p>
      )}

      {loading && (
        <p className="mt-4 text-center text-sm text-white/50">Analyzing...</p>
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-red-400">{error}</p>
      )}

      {description && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            hasHazard ? "border-red-500 bg-red-950/50" : "border-white/10 bg-white/5"
          }`}
        >
          {hasHazard && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">
              ⚠ Hazard Detected
            </p>
          )}
          <p className="text-base leading-relaxed">{description}</p>
          <button
            onClick={() => speakText(description)}
            className="mt-3 text-sm text-white/60 underline"
          >
            🔊 Repeat
          </button>
        </div>
      )}
    </main>
  );
}