import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  const whatsappGroupUrl = 'https://chat.whatsapp.com/HzCaV5YVz86CjwajiOHR5i';
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dragStartRef = useRef<Position | null>(null);
  const pointerStartRef = useRef<Position | null>(null);
  const draggedRef = useRef(false);

  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

    window.open(whatsappGroupUrl, '_blank', 'noopener,noreferrer');
  };

  return (
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
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>
  );
};

export default WhatsAppFloatingButton;
