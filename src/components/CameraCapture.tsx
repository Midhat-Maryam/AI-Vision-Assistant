"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface CameraCaptureProps {
  onCapture?: (base64: string) => void;
  className?: string;
}

export default function CameraCapture({
  onCapture,
  className = "",
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsReady(false);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setIsReady(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Camera access denied";
      setError(message);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    setIsReady(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isReady) return;

    setIsCapturing(true);

    const { videoWidth, videoHeight } = video;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    const base64 = canvas.toDataURL("image/jpeg", 0.92);

    setCapturedImage(base64);
    onCapture?.(base64);
    setIsCapturing(false);
  }, [isReady, onCapture]);

  const clearCapture = useCallback(() => {
    setCapturedImage(null);
  }, []);

  return (
    <div className={`flex w-full flex-col gap-4 ${className}`}>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black sm:aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />

        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="text-sm text-white/70">Starting camera…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={startCamera}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black active:scale-95"
            >
              Retry
            </button>
          </div>
        )}

        {isCapturing && (
          <div className="pointer-events-none absolute inset-0 bg-white/30" />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={captureFrame}
          disabled={!isReady || isCapturing}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-semibold text-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="inline-block h-5 w-5 rounded-full border-[3px] border-black bg-white" />
          Capture
        </button>

        {capturedImage && (
          <div className="flex flex-col gap-3">
            <p className="text-center text-xs text-white/50">
              Last capture (base64 JPEG)
            </p>
            <div className="overflow-hidden rounded-xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured frame"
                className="w-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={clearCapture}
              className="h-11 w-full rounded-full border border-white/20 text-sm text-white/70 active:scale-[0.98]"
            >
              Clear preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}