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

  // Prevent scroll when modal is open
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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Handle touch events for swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !modalRef.current) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - startYRef.current;

    // Only allow downward swipe
    if (deltaY > 0) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
      modalRef.current.style.opacity = `${1 - deltaY / 300}`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!modalRef.current) return;

    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - startYRef.current;

    isDraggingRef.current = false;
    modalRef.current.style.transform = "";
    modalRef.current.style.opacity = "";

    // Close if swiped down more than 80px
    if (deltaY > 80) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
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

  // Handle click on backdrop (closes modal)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle touch on backdrop (closes modal)
  const handleBackdropTouch = (e: React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - handles tap/click to close */}
      <div
        className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleBackdropClick}
        onTouchStart={handleBackdropTouch}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-lg animate-in slide-in-from-bottom-8 duration-300"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ transition: "transform 0.2s ease, opacity 0.2s ease" }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-bone p-6 shadow-2xl md:p-8">
            {/* Close button - larger touch target for mobile */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-2 text-ink/40 transition hover:bg-ink/5 hover:text-ink active:scale-95 md:right-4 md:top-4 md:p-1.5"
              aria-label="Close modal"
            >
              <X size={22} className="md:size-5" />
            </button>

            {/* Content */}
            <div className="relative">
              {/* Animated sparkle icon */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br from-lava to-gold shadow-lg md:h-14 md:w-14">
                <Sparkles className="h-8 w-8 animate-spin-slow text-paper md:h-7 md:w-7" />
              </div>

              <h2 className="font-display text-3xl font-black text-ink md:text-4xl">
                Coming Soon
              </h2>

              <p className="mt-2 text-sm leading-6 text-ink/60">
                The{" "}
                <span className="font-bold text-lava">{brand.merchName}</span>{" "}
                clothing line is currently in production. Sign up to be the
                first to know when we drop.
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

              {/* Features list */}
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
    </>
  );
}
