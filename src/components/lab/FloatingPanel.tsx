"use client";
import React from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';

interface FloatingPanelProps {
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
  initialPos?: { x: number; y: number };
  onPositionChange?: (p: { x: number; y: number }) => void;
}

export default function FloatingPanel({ children, title, onClose, initialPos, onPositionChange }: FloatingPanelProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const storageKey = 'lemma:floatingPanel:pos';

  const defaultPos = { x: 40, y: 80 };

  // Avoid reading localStorage during render/SSR — use defaults and hydrate on mount
  const [pos, setPos] = React.useState(defaultPos);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPos(parsed);
          return;
        }
      }
      if (initialPos) setPos(initialPos);
    } catch (e) {
      if (initialPos) setPos(initialPos);
    }
  }, [initialPos]);

  const persist = (p: { x: number; y: number }) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(p));
      if (onPositionChange) onPositionChange(p);
    } catch (e) {
      // ignore
    }
  };

  const [isDragging, setIsDragging] = React.useState(false);
  const [popping, setPopping] = React.useState(false);

  const onDragEnd = (_: any, info: PanInfo) => {
    // framer gives us offset from drag start — but we stored absolute pos in state
    const offsetX = info.offset.x;
    const offsetY = info.offset.y;
    let x = pos.x + offsetX;
    let y = pos.y + offsetY;

    const margin = 12;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const panelW = panelRef.current?.offsetWidth ?? 520;
    const panelH = panelRef.current?.offsetHeight ?? 300;

    // snap to edges with margin
    if (x < margin) x = margin;
    if (x + panelW > vw - margin) x = Math.max(margin, vw - panelW - margin);
    if (y < margin) y = margin;
    if (y + panelH > vh - margin) y = Math.max(margin, vh - panelH - margin);

    const next = { x, y };
    setIsDragging(false);

  // determine which edge we snapped to for a small pop-out animation
  // reuse previously computed vw and panelW variables
    const nearLeft = x <= margin + 4;
    const nearRight = x + panelW >= vw - margin - 4;

    if (nearLeft || nearRight) {
      // pop outward by a few pixels then settle
      const popOffset = nearLeft ? -14 : 14;
      const popped = { x: next.x + popOffset, y: next.y };
      setPopping(true);
      setPos(popped);
      // after short delay, settle to final snapped position using the spring
      window.setTimeout(() => {
        setPos(next);
        setPopping(false);
        persist(next);
      }, 160);
    } else {
      setPos(next);
      persist(next);
    }
  };

  const onDragStart = () => {
    setIsDragging(true);
  };

  return (
    <motion.div
      ref={panelRef}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      initial={{ x: pos.x, y: pos.y, scale: 0.98, opacity: 0 }}
      animate={{ x: pos.x, y: pos.y, scale: 1, opacity: 1 }}
      transition={{ x: { type: 'spring', stiffness: 450, damping: 30 }, y: { type: 'spring', stiffness: 450, damping: 30 }, default: { duration: 0.18 } }}
      className={`fixed z-50 w-[520px] max-w-[90%] rounded-xl bg-[#0f0f14] border border-white/6 overflow-hidden will-change-transform ${isDragging ? 'shadow-2xl ring-2 ring-white/6' : 'shadow-xl'}`}
      style={{ right: 'auto', bottom: 'auto' }}
    >
      <div
        className="flex items-center justify-between p-2 bg-[#111116] border-b border-white/6 cursor-grab"
        onPointerDown={(e) => dragControls.start(e as any)}
        onPointerUp={() => setIsDragging(false)}
      >
        <div className="text-sm font-semibold">{title || 'Panel'}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            // reset to default position
            setPos(defaultPos);
            persist(defaultPos);
          }} className="px-2 py-1 text-xs rounded hover:bg-white/5">Reset</button>
          <button onClick={onClose} className="px-2 py-1 text-xs rounded hover:bg-white/5">Close</button>
        </div>
      </div>
      <div className="p-3 max-h-[65vh] overflow-auto">{children}</div>
    </motion.div>
  );
}
