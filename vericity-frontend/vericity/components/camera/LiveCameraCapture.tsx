"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useGeolocation } from "@/lib/hooks/useGeolocation";

/**
 * Live-capture only, per section 11 ("Live evidence only. Camera capture
 * uses getUserMedia; the file input never accepts gallery uploads."). This
 * component intentionally has no <input type="file"> fallback.
 */
export function LiveCameraCapture({
  onCapture
}: {
  onCapture: (photoDataUrl: string, geo: { lat: number; long: number; accuracy: number }) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const geo = useGeolocation();

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch (err) {
      setCameraError(
        "Camera access was denied or isn't available. VeriCity only accepts live photos captured in the app — check your browser's camera permission and try again."
      );
    }
  }, []);

  useEffect(() => {
    startCamera();
    geo.request();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPhoto(dataUrl);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const retake = () => {
    setPhoto(null);
    startCamera();
  };

  const weakGps = geo.position && geo.position.accuracy > 50;

  const confirm = () => {
    if (!photo || !geo.position) return;
    onCapture(photo, geo.position);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-ink">
        {!photo && (
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        )}
        {photo && <img src={photo} alt="Captured evidence" className="h-full w-full object-cover" />}
        <canvas ref={canvasRef} className="hidden" />

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/90 p-6 text-center text-sm text-paper-raised">
            {cameraError}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>
          {geo.loading && "Locating you…"}
          {geo.error && `Location unavailable: ${geo.error}`}
          {geo.position &&
            `GPS locked · ±${Math.round(geo.position.accuracy)}m accuracy`}
        </span>
        {weakGps && <span className="font-medium text-signal">Low accuracy — move to open sky if possible</span>}
      </div>

      {!photo ? (
        <Button onClick={capture} disabled={!ready || !!cameraError} fullWidth>
          Capture photo
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={retake} className="flex-1">
            Retake
          </Button>
          <Button onClick={confirm} disabled={!geo.position} className="flex-1">
            Use this photo
          </Button>
        </div>
      )}
    </div>
  );
}
