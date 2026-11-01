"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CheckCircle2, Keyboard, RotateCcw, XCircle } from "lucide-react";

type CheckInPayload = {
  status: "success" | "duplicate" | "not_found" | "unpaid" | "invalid" | "wrong_day" | "choose_day";
  message: string;
  ticket?: {
    qrCode: string;
    attendeeName?: string | null;
    attendeeEmail?: string | null;
    checkedInAt?: string | null;
    checkInDays?: string[];
    tierName?: string | null;
    entryDays?: string[];
    event: {
      title: string;
      venue: string;
      city: string;
      startsAt: string;
    };
    order: {
      email: string;
      status: string;
      reference?: string;
      transactionStatus?: string;
    };
  };
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

/** gateDays: entry days used by any live event, e.g. ["Day 1", "Day 3"]. Empty hides the picker. */
export function AdminCheckInPanel({ gateDays = [] }: { gateDays?: string[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CheckInPayload | null>(null);
  const [error, setError] = useState("");
  const [scannerNotice, setScannerNotice] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gateDay, setGateDay] = useState("");

  const checkIn = useCallback(async (nextCode: string) => {
    if (!nextCode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/admin/tickets/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: nextCode, day: gateDay || undefined }),
    });
    const payload = (await response.json().catch(() => null)) as CheckInPayload | null;

    setIsSubmitting(false);

    if (!payload) {
      setError("Unable to read check-in response.");
      return;
    }

    setResult(payload);
  }, [gateDay, isSubmitting]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    isScanningRef.current = false;
    setIsCameraActive(false);
    setScannerNotice("");
  }, []);

  async function startCamera() {
    setError("");
    setScannerNotice("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access needs HTTPS or localhost. Open the live check-in domain, use localhost, or enter the ticket manually.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      setScannerNotice("Scanner is active. Hold the ticket QR code inside the camera frame.");
    } catch (cameraError) {
      const errorName = cameraError instanceof DOMException ? cameraError.name : "";

      if (errorName === "NotAllowedError") {
        setError("Camera permission was blocked. Allow camera access in the browser, then start the scanner again.");
        return;
      }

      if (errorName === "NotFoundError") {
        setError("No usable camera was found on this device. Use manual entry instead.");
        return;
      }

      setError("Camera could not start. Use HTTPS, localhost, or the live check-in domain, then try again.");
    }
  }

  useEffect(() => {
    if (!isCameraActive || !videoRef.current || !streamRef.current) return;

    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {
      setError("Camera opened, but the video preview could not start. Try refreshing this admin page.");
    });
  }, [isCameraActive]);

  useEffect(() => {
    if (!isCameraActive || !videoRef.current) return;

    let cancelled = false;
    const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;

    async function scan() {
      if (cancelled || isScanningRef.current || !videoRef.current) return;

      try {
        let rawValue = "";

        if (detector) {
          const barcodes = await detector.detect(videoRef.current);
          rawValue = barcodes[0]?.rawValue ?? "";
        } else {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas?.getContext("2d", { willReadFrequently: true });

          if (canvas && context && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            rawValue = jsQR(frame.data, frame.width, frame.height)?.data ?? "";
          }
        }

        if (rawValue) {
          isScanningRef.current = true;
          setCode(rawValue);
          stopCamera();
          await checkIn(rawValue);
          return;
        }
      } catch {
        // Keep scanning; camera frames can fail while video is settling.
      }

      window.setTimeout(scan, 450);
    }

    scan();

    return () => {
      cancelled = true;
    };
  }, [checkIn, isCameraActive, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const statusStyles = {
    success: "border-gold/40 bg-gold/10 text-gold",
    duplicate: "border-lava/40 bg-lava/10 text-lava",
    not_found: "border-lava/40 bg-lava/10 text-lava",
    unpaid: "border-lava/40 bg-lava/10 text-lava",
    invalid: "border-lava/40 bg-lava/10 text-lava",
    wrong_day: "border-lava/40 bg-lava/10 text-lava",
    choose_day: "border-gold/40 bg-gold/10 text-gold",
  } as const;

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_420px]">
      {gateDays.length > 0 ? (
        <div className="rounded-ui border border-gold/30 bg-gold/10 p-4 lg:col-span-2">
          <label className="flex flex-wrap items-center gap-3 text-sm font-black text-gold">
            Gate day for multi-day tickets
            <select
              value={gateDay}
              onChange={(event) => setGateDay(event.target.value)}
              className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
            >
              <option value="">Not set</option>
              {gateDays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs leading-5 text-paper/58">
            Set this to today at multi-day events, or their tickets will not scan. Normal one-entry tickets check in the same as always.
          </p>
        </div>
      ) : null}
      <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <div className="aspect-video overflow-hidden rounded-ui border border-white/10 bg-ink">
          {isCameraActive ? (
            <>
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            </>
          ) : (
            <div className="grid h-full place-items-center text-center">
              <div>
                <Camera className="mx-auto text-gold" size={32} />
                <p className="mt-3 text-sm text-paper/58">Camera scanner is idle.</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={isCameraActive ? stopCamera : startCamera}
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-ui bg-gold px-4 text-sm font-black text-ink transition hover:bg-paper"
          >
            <Camera size={16} />
            {isCameraActive ? "Stop camera" : "Start scanner"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCode("");
              setResult(null);
              setError("");
              setScannerNotice("");
            }}
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-ui border border-white/12 px-4 text-sm font-black text-paper/68 transition hover:border-paper hover:text-paper"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
        {scannerNotice ? (
          <p className="mt-4 rounded-ui border border-gold/35 bg-gold/10 p-3 text-sm text-gold">{scannerNotice}</p>
        ) : null}
        {error ? <p className="mt-4 rounded-ui border border-lava/40 bg-lava/10 p-3 text-sm text-lava">{error}</p> : null}
      </div>

      <aside className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-gold">
          <Keyboard size={15} />
          Manual check-in
        </p>
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="mt-4 min-h-28 w-full rounded-ui border border-white/10 bg-ink p-3 text-sm text-paper"
          placeholder="Paste ticket URL or QR code"
        />
        <button
          type="button"
          disabled={!code.trim() || isSubmitting}
          onClick={() => checkIn(code)}
          className="focus-ring mt-3 inline-flex h-11 w-full items-center justify-center rounded-ui bg-gold px-4 text-sm font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Checking..." : "Check in ticket"}
        </button>

        {result ? (
          <div className={`mt-5 rounded-ui border p-4 ${statusStyles[result.status]}`}>
            <div className="flex items-center gap-2">
              {result.status === "success" ? <CheckCircle2 size={19} /> : <XCircle size={19} />}
              <p className="font-black">{result.message}</p>
            </div>
            {result.ticket ? (
              <div className="mt-4 grid gap-2 text-sm text-paper/72">
                <p><span className="text-paper/42">Attendee:</span> {result.ticket.attendeeName ?? "Guest"}</p>
                <p><span className="text-paper/42">Email:</span> {result.ticket.attendeeEmail ?? result.ticket.order.email}</p>
                <p><span className="text-paper/42">Event:</span> {result.ticket.event.title}</p>
                {result.ticket.tierName ? (
                  <p><span className="text-paper/42">Ticket:</span> {result.ticket.tierName}</p>
                ) : null}
                {result.ticket.entryDays && result.ticket.entryDays.length > 0 ? (
                  <p>
                    <span className="text-paper/42">Valid for:</span> {result.ticket.entryDays.join(", ")}
                    {result.ticket.checkInDays && result.ticket.checkInDays.length > 0
                      ? ` (used: ${result.ticket.checkInDays.join(", ")})`
                      : ""}
                  </p>
                ) : null}
                <p><span className="text-paper/42">Venue:</span> {result.ticket.event.venue}</p>
                <p><span className="text-paper/42">Reference:</span> {result.ticket.order.reference}</p>
                {result.ticket.checkedInAt ? (
                  <p><span className="text-paper/42">Checked in:</span> {new Date(result.ticket.checkedInAt).toLocaleString()}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
