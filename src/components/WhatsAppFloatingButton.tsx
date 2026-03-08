import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'agrisoko_whatsapp_button_position';
const EDGE_OFFSET = 24;
const DRAG_THRESHOLD = 8;

type Position = {
  x: number;
  y: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const WhatsAppFloatingButton: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const whatsappGroupUrl = 'https://chat.whatsapp.com/HzCaV5YVz86CjwajiOHR5i';
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dragStartRef = useRef<Position | null>(null);
  const pointerStartRef = useRef<Position | null>(null);
  const draggedRef = useRef(false);

  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');

  const getBounds = useCallback(() => {
    const width = buttonRef.current?.offsetWidth || 56;
    const height = buttonRef.current?.offsetHeight || 56;

    return {
      minX: EDGE_OFFSET,
      maxX: Math.max(EDGE_OFFSET, window.innerWidth - width - EDGE_OFFSET),
      minY: EDGE_OFFSET,
      maxY: Math.max(EDGE_OFFSET, window.innerHeight - height - EDGE_OFFSET),
      width,
      height,
    };
  }, []);

  const getDefaultPosition = useCallback(() => {
    const { maxY } = getBounds();
    return {
      x: EDGE_OFFSET,
      y: maxY,
    };
  }, [getBounds]);

  const clampPosition = useCallback((nextPosition: Position) => {
    const bounds = getBounds();
    return {
      x: clamp(nextPosition.x, bounds.minX, bounds.maxX),
      y: clamp(nextPosition.y, bounds.minY, bounds.maxY),
    };
  }, [getBounds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedPosition = window.localStorage.getItem(STORAGE_KEY);
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition) as Position;
        setPosition(clampPosition(parsedPosition));
        return;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setPosition(getDefaultPosition());
  }, [clampPosition, getDefaultPosition]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setPosition((currentPosition) =>
        clampPosition(currentPosition || getDefaultPosition())
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition, getDefaultPosition]);

  useEffect(() => {
    if (!position || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!position) return;

    dragStartRef.current = position;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    draggedRef.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || !dragStartRef.current || !pointerStartRef.current) return;

    const deltaX = event.clientX - pointerStartRef.current.x;
    const deltaY = event.clientY - pointerStartRef.current.y;

    if (
      !draggedRef.current &&
      Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD
    ) {
      draggedRef.current = true;
    }

    if (!draggedRef.current) return;

    setPosition(
      clampPosition({
        x: dragStartRef.current.x + deltaX,
        y: dragStartRef.current.y + deltaY,
      })
    );
  };

  const finishDrag = () => {
    if (!isDragging) return;

    setIsDragging(false);
    dragStartRef.current = null;
    pointerStartRef.current = null;

    if (!draggedRef.current) return;

    setPosition((currentPosition) => {
      if (!currentPosition) return currentPosition;
      const bounds = getBounds();
      const midpoint = window.innerWidth / 2;

      return {
        x: currentPosition.x + bounds.width / 2 < midpoint ? bounds.minX : bounds.maxX,
        y: clamp(currentPosition.y, bounds.minY, bounds.maxY),
      };
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishDrag();
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishDrag();
  };

  const handleClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }

    if (!user) {
      setShowSignupPrompt(true);
      return;
    }

    window.open(whatsappGroupUrl, '_blank', 'noopener,noreferrer');
  };

  const openWhatsappGroup = () => {
    window.open(whatsappGroupUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCreateAccount = () => {
    setShowSignupPrompt(false);
    navigate('/login?mode=signup&next=/browse');
  };

  const handleNoThanks = () => {
    setShowSignupPrompt(false);
    openWhatsappGroup();
  };

  const handleLater = () => {
    setShowSignupPrompt(false);
    setFlashMessage('See you soon.');
    openWhatsappGroup();
  };

  useEffect(() => {
    if (!flashMessage) return;
    const timer = window.setTimeout(() => setFlashMessage(''), 2000);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="fixed bg-green-500 text-white rounded-full p-4 shadow-lg transition-transform duration-200 hover:bg-green-600 hover:scale-110 z-50 flex items-center justify-center touch-none select-none"
        style={
          position
            ? {
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: isDragging ? 'scale(1.05)' : undefined,
                transition: isDragging ? 'none' : undefined,
              }
            : undefined
        }
        title="Join our WhatsApp group"
        aria-label="Join WhatsApp group"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.47 0 .11 5.36.11 11.95c0 2.11.55 4.18 1.6 6.01L0 24l6.22-1.63a11.83 11.83 0 0 0 5.84 1.49h.01c6.58 0 11.94-5.36 11.94-11.95 0-3.19-1.24-6.18-3.49-8.43Zm-8.45 18.36h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.69.97.99-3.59-.24-.37a9.9 9.9 0 0 1-1.52-5.3c0-5.47 4.45-9.92 9.93-9.92 2.65 0 5.14 1.03 7.01 2.9a9.86 9.86 0 0 1 2.91 7.01c0 5.47-4.46 9.89-9.99 9.89Zm5.43-7.44c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.46-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5-.17-.01-.37-.01-.57-.01s-.52.08-.8.37c-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.09 3.2 5.07 4.48.71.31 1.27.49 1.7.62.71.22 1.35.19 1.86.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
        </svg>
      </button>

      {showSignupPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setShowSignupPrompt(false)}
            aria-label="Close prompt"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <p className="text-sm font-semibold text-slate-900">
              Would you like to create an account first?
            </p>
            <p className="mt-2 text-sm text-slate-600">
              It helps you save listings, message faster, and build trust before joining WhatsApp.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleCreateAccount}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={handleNoThanks}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleLater}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {flashMessage && (
        <div className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {flashMessage}
        </div>
      )}
    </>
  );
};

export default WhatsAppFloatingButton;
