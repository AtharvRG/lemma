'use client';
import React from 'react';
import { useProjectStore } from '@/hooks/useProjectStore';
import { ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { LinterIssue, AstExecutionStep } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const issueColors: Record<LinterIssue['type'], string> = {
  Perf: 'bg-blue-500',
  Security: 'bg-red-500',
  Style: 'bg-yellow-500',
};

interface TimelineStripProps {
  isCollapsed: boolean;
  togglePanel: () => void;
  onFloatToggle?: () => void;
}

export function TimelineStrip({ isCollapsed, togglePanel, onFloatToggle }: TimelineStripProps) {
  const { executionSteps, currentStepIndex, setCurrentStepIndex, setExecutionSteps, language } = useProjectStore();
  const totalSteps = executionSteps.length;
  const currentStep = executionSteps[currentStepIndex];

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentStepIndex(parseInt(e.target.value, 10));
  };

  const getStepDescription = (step: any, index: number) => {
    // Check if it's a JavaScript-style execution step (has line property but no node)
    if ('line' in step && !('node' in step)) {
      return `Execute line ${step.line || 0}`;
    } else if ('node' in step) {
      // It's an AST-based step
      const astStep = step as AstExecutionStep;
      return astStep.executionContext?.description || `${astStep.node.type}`;
    } else {
      // Fallback
      return `Execute`;
    }
  };

  const getStepPhase = (step: any) => {
    // Check if it's a JavaScript-style execution step
    if ('line' in step && !('node' in step)) {
      return 'execution';
    } else if ('node' in step) {
      const astStep = step as AstExecutionStep;
      return astStep.executionContext?.phase || 'execution';
    }
    return 'execution';
  };

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
  const playRef = React.useRef<number | null>(null);

  // Refs to hold latest values for interval callback
  const playingRef = React.useRef<boolean>(false);
  const speedRef = React.useRef<number>(1);
  const stepHandlerRef = React.useRef<() => void>(() => {});
  const intervalIdRef = React.useRef<number | null>(null);

  // Initialize refs when props/state change
  React.useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  React.useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  // Keep a ref to the step handler (advance one step). Use functional updater
  // so the callback doesn't rely on an outer `currentStepIndex` snapshot.
  React.useEffect(() => {
    stepHandlerRef.current = () => {
      const i = currentIndexRef.current;
      if (i < totalSteps - 1) {
        const next = Math.min(totalSteps - 1, i + 1);
        setCurrentStepIndex(next);
      } else {
        setIsPlaying(false);
      }
    };
  }, [totalSteps, setCurrentStepIndex, setIsPlaying]);

  // Keep a ref of the latest currentStepIndex for the interval callback
  const currentIndexRef = React.useRef<number>(currentStepIndex);
  React.useEffect(() => {
    currentIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  // Effect to manage interval lifecycle: start/stop/restart when playing or speed changes
  React.useEffect(() => {
    // clear any existing interval
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (!playingRef.current) return;

    const ms = Math.max(20, Math.round(200 / (speedRef.current || 1)));
    // use window.setInterval to get a numeric id compatible with clearInterval
    intervalIdRef.current = window.setInterval(() => {
      // call the latest handler
      stepHandlerRef.current();
    }, ms) as unknown as number;

    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, []);

  // Local state mirror for current index to avoid stale closures
  const [currentIndex, setCurrentIndex] = React.useState(currentStepIndex);
  React.useEffect(() => setCurrentIndex(currentStepIndex), [currentStepIndex]);

  const jumpToStart = () => setCurrentStepIndex(0);
  const jumpToEnd = () => setCurrentStepIndex(Math.max(0, totalSteps - 1));

  // Inline style for slow pulse animation used on active marker
  const pulseStyle = `@keyframes pulseSlow { 0% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.12); opacity: .85 } 100% { transform: scale(1); opacity: 1 } } .animate-pulse-slow { animation: pulseSlow 1.6s ease-in-out infinite; }`;

  // Pop animation for the central step label when the current step changes
  const labelPopStyle = `@keyframes pop { 0% { transform: translateY(0) scale(1); opacity: 0.9 } 30% { transform: translateY(-4px) scale(1.03); opacity: 1 } 100% { transform: translateY(0) scale(1); opacity: 1 } } .animate-pop { animation: pop 260ms cubic-bezier(.2,.9,.3,1); }`;
  const [labelKey, setLabelKey] = React.useState(0);
  React.useEffect(() => {
    // bump key to retrigger animation when currentIndex changes
    setLabelKey(k => k + 1);
  }, [currentIndex]);

  return (
    <div
      className="h-full min-h-0 flex flex-col bg-gray-900 rounded-lg shadow-sm overflow-hidden"
      tabIndex={0}
      role="region"
      aria-label="Execution timeline"
      onKeyDown={(e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsPlaying(p => !p);
        } else if (e.code === 'ArrowRight') {
          setCurrentStepIndex(Math.min(totalSteps - 1, currentIndexRef.current + 1));
        } else if (e.code === 'ArrowLeft') {
          setCurrentStepIndex(Math.max(0, currentIndexRef.current - 1));
        } else if (e.code === 'Home') {
          jumpToStart();
        } else if (e.code === 'End') {
          jumpToEnd();
        }
      }}
    >
  <style dangerouslySetInnerHTML={{ __html: pulseStyle + '\n' + labelPopStyle }} />
      <div className="flex-shrink-0 h-12 flex items-center justify-between px-4 bg-gray-800 border-b border-gray-700">
        <h2 className="font-semibold text-base">Timeline</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(p => !p)} className="px-3 py-1 rounded border border-gray-500 bg-gray-900 text-white hover:bg-gray-700">
            {isPlaying ? 'Pause' : 'Play'}
          </button>
            <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-gray-900 text-xs border rounded px-2 py-2 focus:outline-none focus:ring-2 transition-colors shadow-lg"
            style={{ minWidth: 56 }}
          >
            <option value={0.5} style={{ background: '#17161b', color: '#5eead4', border: 'none' }}>0.5x</option>
            <option value={1} style={{ background: '#17161b', color: '#5eead4', border: 'none' }}>1x</option>
            <option value={2} style={{ background: '#17161b', color: '#5eead4', border: 'none' }}>2x</option>
            <option value={4} style={{ background: '#17161b', color: '#5eead4', border: 'none' }}>4x</option>
          </select>
          <button onClick={jumpToStart} className="px-3 py-1 rounded text-white hover:bg-gray-700">Start</button>
          <button onClick={jumpToEnd} className="px-3 py-1 rounded text-white hover:bg-gray-700">End</button>
        </div>
      </div>
      <div className="border-t border-gray-700" />

      <AnimatePresence>
        {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              // constrain the timeline to a scrollable panel so inner content doesn't push the page
              className="flex-grow flex flex-col overflow-auto max-h-[calc(100vh-6rem)] min-h-0"
            >
              <div className="pt-4 pb-4 px-4 w-full overflow-auto relative">
                {/* Timeline Bar Section - single bar with step markers */}
                <div className="w-full flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setCurrentStepIndex(Math.max(0, currentIndex - 1))}
                    className="p-1 rounded border border-gray-500 bg-gray-900 hover:bg-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={totalSteps - 1}
                      value={currentIndex}
                      onChange={e => { setCurrentStepIndex(Number(e.target.value)); setCurrentIndex(Number(e.target.value)); }}
                      className="w-full h-2 bg-gray-300 rounded-full appearance-none focus:outline-none"
                      style={{ accentColor: '#b5e3b7' }}
                    />
                    {/* Step markers overlayed on the slider */}
                    <div className="absolute left-0 right-0 top-1 flex justify-between pointer-events-none">
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStepIndex(Math.min(totalSteps - 1, currentIndex + 1))}
                    className="p-1 rounded border border-gray-500 bg-gray-900 hover:bg-gray-700"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
                <span>
                <div className="text-xs text-gray-400 text-center mt-10 mb-2">
                  Step {currentIndex + 1} of {totalSteps} • {currentStep ? getStepPhase(currentStep) : 'Ready'}
                </div>
                </span>
              {/* Sticky timeline bar: stays visible while the rest (ExecutionSummary / RunHistory) scrolls */}
              
              {/* ExecutionSummary removed from timeline strip as requested */}

              {/* Animated current-step marker overlay */}
              {totalSteps > 0 && (
                <div aria-hidden className="absolute left-0 right-0 top-12 z-40 flex justify-center px-4">
                  <div className="w-full max-w-[66%] flex">
                    {executionSteps.map((_, i) => (
                      <div key={i} className="relative flex-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => { setCurrentStepIndex(i); setCurrentIndex(i); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setCurrentStepIndex(i);
                              setCurrentIndex(i);
                            }
                          }}
                          title={`Jump to step ${i}`}
                          aria-label={`Jump to step ${i}`}
                          className={`w-full flex justify-center focus:outline-none`}
                        >
                          <div
                            className={`transition-transform duration-300 inline-flex items-end ${i === currentIndex ? 'scale-110' : 'scale-75'}`}
                          >
                            <div
                              className={`rounded-full ${i === currentIndex ? 'h-4 w-2 bg-gradient-to-b from-aquamarine/90 to-aquamarine/60 animate-pulse-slow' : 'h-2 w-1 bg-white/10'} `}
                              aria-hidden="true"
                            />
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* If no steps, show placeholder */}
              {totalSteps === 0 && (
                <p className="text-gray-500 text-sm text-center">Record execution to see the timeline.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TimelineStrip;