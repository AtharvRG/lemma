'use client';
import React, { useRef, useLayoutEffect } from 'react';
import { CornerUpLeft, Copy } from 'lucide-react';

type Props = {
  id: string | number;
  timestamp: string | number;
  language: string;
  code: string;
  onRestore: (id: string) => void;
  onCopy: (text: string) => void;
  onSave: () => void;
  className?: string;
  onMeasure?: (height: number) => void;
};

export function RunHistoryCard({ id, timestamp, language, code, onRestore, onCopy, onSave, className, onMeasure }: Props) {
  const fallbackStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    height: '100%',
    boxSizing: 'border-box',
    border: '1px solid rgba(255,255,255,0.04)',
    boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
  };

  const metaStyle: React.CSSProperties = {
    color: 'rgba(226,232,240,0.9)',
    fontSize: 12,
    marginBottom: 4,
  };

  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const el = rootRef.current;
    const measure = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      onMeasure?.(h);
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [code, onMeasure]);

  return (
    <div ref={rootRef} className={`${className ?? ''}`} style={fallbackStyle}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={metaStyle}>{new Date(timestamp).toLocaleString()}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>{language}</div>
  <pre style={{ fontSize: 12, marginTop: 8, maxHeight: 180, overflow: 'auto', color: 'rgba(226,232,240,0.9)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{code}</pre>
      </div>
      <div style={{ width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 8, gap: 8 }}>
        <button title="Restore this run" onClick={() => onRestore(String(id))} style={{ padding: 8, borderRadius: 6, background: 'transparent' }}>
          <CornerUpLeft className="w-4 h-4" />
        </button>
        <button title="Copy code" onClick={() => onCopy(code)} style={{ padding: 8, borderRadius: 6, background: 'transparent' }}>
          <Copy className="w-4 h-4" />
        </button>
        <button title="Save to cloud" onClick={onSave} style={{ padding: 8, borderRadius: 6, background: 'transparent' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><path d="M12 3v10m0 0l-4-4m4 4 4-4M5 20h14a2 2 0 0 0 2-2V9a4 4 0 0 0-4-4h-1.26A6 6 0 0 0 6 9v1"/></svg>
        </button>
      </div>
    </div>
  );
}

export default RunHistoryCard;
