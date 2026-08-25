"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DBL_SCALE = 2.5;
const TAP_CLOSE_DELAY = 260;

export function ImageLightbox({ src, alt, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const stateRef = useRef({ scale, pos });
  const containerRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const startPos = useRef<{ x: number; y: number; moved: number } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doublePending = useRef(false);

  useEffect(() => {
    stateRef.current = { scale, pos };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function clampScale(value: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  }

  function zoomBy(factor: number, anchor?: { x: number; y: number }) {
    const { scale: cur, pos: curPos } = stateRef.current;
    const next = clampScale(cur * factor);
    if (next === cur) return;
    let npos = { x: 0, y: 0 };
    if (anchor) {
      const k = next / cur - 1;
      npos = { x: curPos.x - anchor.x * k, y: curPos.y - anchor.y * k };
    } else {
      npos = curPos;
    }
    setScale(next);
    setPos(npos);
  }

  function resetZoom() {
    doublePending.current = false;
    setScale(1);
    setPos({ x: 0, y: 0 });
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, { x: e.clientX - cx, y: e.clientY - cy });
  }

  function handleDoubleClick() {
    if (doublePending.current) {
      doublePending.current = false;
      if (stateRef.current.scale > 1) {
        resetZoom();
      } else {
        setScale(DBL_SCALE);
      }
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
      doublePending.current = true;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: stateRef.current.scale };
      startPos.current = null;
      return;
    }
    startPos.current = { x: e.clientX, y: e.clientY, moved: 0 };
    setDragging(stateRef.current.scale > 1);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const p = pointers.current.get(e.pointerId);
    if (!p) return;
    const nx = e.clientX;
    const ny = e.clientY;

    if (pointers.current.size === 2) {
      pointers.current.set(e.pointerId, { x: nx, y: ny });
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const base = pinchRef.current;
      if (!base || base.dist === 0) return;
      const next = clampScale(base.scale * (dist / base.dist));
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const cur = stateRef.current;
        const k = next / cur.scale - 1;
        setPos((prev) => ({ x: prev.x - (mx - cx) * k, y: prev.y - (my - cy) * k }));
      }
      setScale(next);
      return;
    }

    if (startPos.current) {
      const moved = Math.hypot(nx - startPos.current.x, ny - startPos.current.y);
      startPos.current.moved = moved;
    }
    if (stateRef.current.scale > 1) {
      setDragging(true);
      const dx = nx - p.x;
      const dy = ny - p.y;
      pointers.current.set(e.pointerId, { x: nx, y: ny });
      setPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    const wasPinching = pointers.current.size >= 2;
    pointers.current.delete(e.pointerId);
    pinchRef.current = null;
    setDragging(false);
    if (wasPinching) {
      startPos.current = null;
      return;
    }
    const moved = startPos.current?.moved ?? 0;
    startPos.current = null;
    if (moved < 6 && stateRef.current.scale <= 1) {
      closeTimer.current = setTimeout(() => {
        closeTimer.current = null;
        onClose();
      }, TAP_CLOSE_DELAY);
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 touch-none select-none overflow-hidden bg-black/90"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      role="dialog"
      aria-modal="true"
      aria-label="Image en plein écran"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      <div className="grid h-full w-full place-items-center p-4">
        <Image
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes="100vw"
          draggable={false}
          className="h-auto max-h-full w-auto max-w-full object-contain"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.18s ease-out",
            cursor: scale > 1 ? "grab" : "zoom-in",
            touchAction: "none",
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-white/60">
        Molette ou pincement pour zoomer · double-clic pour zoomer · Échap pour fermer
      </div>
    </div>
  );
}