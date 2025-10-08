'use client';
import React from 'react';
import { Play, RotateCcw, Share2, LoaderCircle } from 'lucide-react';
import { useProjectStore } from '@/hooks/useProjectStore';
import Link from 'next/link';

export function Toolbar() {
  const { run, reset, isRunning, openShareDialog } = useProjectStore();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or if modifier keys are pressed
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea' || target?.getAttribute?.('role') === 'textbox';
      if (e.key.toLowerCase() === 'r' && !isEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run]);

  return (
    <header className="flex-shrink-0 h-14 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-4 z-20">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-lg font-bold text-white">Lemma</span>
      </Link>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={run}
            disabled={isRunning}
            className="px-4 py-2 flex items-center gap-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Run (R)"
          >
            {isRunning ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            Run
          </button>

          <button onClick={reset} className="px-2 py-2 flex items-center gap-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors" title="Reset">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-gray-400 ml-4">Press <kbd className="px-1 py-0.5 bg-black/20 rounded">R</kbd> to run</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={openShareDialog}
          className="p-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}