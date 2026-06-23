"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Clock, Mail, Check } from "lucide-react";
import { brand } from "@/lib/sample-data";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  // Track whether the touch started on the backdrop itself
  const backdropTouchRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // --- Modal swipe-to-close ---
  const handleModalTouchStart = (e: React.TouchEvent) => {
    // Don't treat swipes from inner interactive elements as swipe-to-close
    isDraggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };

  const handleModalTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !modalRef.current) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
      modalRef.current.style.opacity = `${1 - deltaY / 300}`;
    }
  };

  const handleModalTouchEnd = (e: React.TouchEvent) => {
    if (!modalRef.current) return;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    isDraggingRef.current = false;
    modalRef.current.style.transform = "";
    modalRef.current.style.opacity = "";
    if (deltaY > 80) onClose();
  };

  // --- Backdrop tap-to-close ---
  // We track touchstart on the backdrop itself. If touchend fires on the
  // same backdrop element (not a bubbled event from the modal card), we close.
  const handleBackdropTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    backdropTouchRef.current = e.target === e.currentTarget;
  };

  const handleBackdropTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (backdropTouchRef.current && e.target === e.currentTarget) {
      onClose();
    }
    backdropTouchRef.current = false;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
      setTimeout(() => {
        onClose();
        setEmail("");
        setIsSubmitted(false);
      }, 3000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    // Single full-screen layer — backdrop + centering wrapper in one element.
    // Using one element avoids the stacking issue where the modal sits on
    // a sibling backdrop, causing backdrop tap events to always hit the
    // wrapper and never register as "outside the card".
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      onTouchStart={handleBackdropTouchStart}
      onTouchEnd={handleBackdropTouchEnd}
    >
      {/* Card — stop all pointer events from reaching the backdrop */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg animate-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          e.stopPropagation();
          handleModalTouchStart(e);
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
          handleModalTouchMove(e);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          handleModalTouchEnd(e);
        }}
        style={{ transition: "transform 0.2s ease, opacity 0.2s ease" }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-bone p-6 shadow-2xl md:p-8">
          {/* Close button — large touch target, visually tight */}
          {/* The outer span is the 44×44px tap zone; the inner div is the visual circle */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="focus-ring absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full md:right-3 md:top-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition hover:bg-ink/8 hover:text-ink active:scale-90">
              <X size={18} />
            </span>
          </button>

          <div className="relative">
            {/* Icon */}
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br from-lava to-gold shadow-lg md:h-14 md:w-14">
              <Sparkles className="h-8 w-8 animate-spin-slow text-paper md:h-7 md:w-7" />
            </div>

            <h2 className="font-display text-3xl font-black text-ink md:text-4xl">
              Coming Soon
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink/60">
              The <span className="font-bold text-lava">{brand.merchName}</span>{" "}
              clothing line is currently in production. Sign up to be the first
              to know when we drop.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-ink/60">
              <Clock size={14} className="text-gold" />
              <span>Launching Q2 2026</span>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="mt-6">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="focus-ring h-12 w-full rounded-ui border border-ink/10 bg-paper/50 pl-9 pr-3 text-sm text-ink placeholder:text-ink/30 transition focus:border-ink focus:outline-none sm:h-11"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="focus-ring inline-flex h-12 shrink-0 items-center justify-center rounded-ui bg-ink px-5 text-sm font-black text-paper transition hover:bg-lava disabled:opacity-50 sm:h-11"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-paper/30 border-t-paper" />
                    ) : (
                      "Notify Me"
                    )}
                  </button>
                </div>
                <p className="mt-3 text-xs text-ink/40">
                  No spam, just the drop date and early access.
                </p>
              </form>
            ) : (
              <div className="mt-6 flex items-center gap-3 rounded-ui bg-emerald-50 p-3 text-emerald-700">
                <Check size={18} className="shrink-0" />
                <span className="text-sm font-medium">
                  You&apos;re on the list! 🎉
                </span>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-2 border-t border-ink/5 pt-6">
              <div className="flex items-center gap-2 text-xs font-medium text-ink/50">
                <Sparkles size={12} className="animate-pulse text-gold" />
                <span>Premium quality</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-ink/50">
                <Sparkles size={12} className="animate-pulse text-gold" />
                <span>Limited drops</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
