"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef, useMemo } from 'react';
import GradientText from '@/components/ui/GradientText';

export function PreviewStrip() {
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: stickyRef, offset: ['start end', 'end start'] });
  // Staggered reveal segments (start,end) pairs in scroll progress space
  // Fixed segment descriptors (start, end, text, accent?)
  const segments = useMemo(() => ([
    { range: [0.00, 0.22] as [number, number], text: 'Hey...this is', accent: false },
    { range: [0.14, 0.36] as [number, number], text: 'what you will', accent: false },
    { range: [0.28, 0.50] as [number, number], text: 'see inside', accent: false },
    { range: [0.42, 0.64] as [number, number], text: 'Lemma.', accent: true },
    { range: [0.42, 0.64] as [number, number], text: '\ud83d\udc47', accent: false },
  ]), []);
  // Call hooks explicitly per segment index (constant length keeps order stable)
  const opacity0 = useTransform(scrollYProgress, segments[0].range, [0, 1]);
  const opacity1 = useTransform(scrollYProgress, segments[1].range, [0, 1]);
  const opacity2 = useTransform(scrollYProgress, segments[2].range, [0, 1]);
  const opacity3 = useTransform(scrollYProgress, segments[3].range, [0, 1]);
  const opacity4 = useTransform(scrollYProgress, segments[4].range, [0, 1]);
  const y0 = useTransform(scrollYProgress, segments[0].range, [28, 0]);
  const y1 = useTransform(scrollYProgress, segments[1].range, [28, 0]);
  const y2 = useTransform(scrollYProgress, segments[2].range, [28, 0]);
  const y3 = useTransform(scrollYProgress, segments[3].range, [28, 0]);
  const y4 = useTransform(scrollYProgress, segments[4].range, [28, 0]);
  const b0 = useTransform(scrollYProgress, segments[0].range, [8, 0]);
  const b1 = useTransform(scrollYProgress, segments[1].range, [8, 0]);
  const b2 = useTransform(scrollYProgress, segments[2].range, [8, 0]);
  const b3 = useTransform(scrollYProgress, segments[3].range, [8, 0]);
  const b4 = useTransform(scrollYProgress, segments[4].range, [8, 0]);
  const opacities = [opacity0, opacity1, opacity2, opacity3, opacity4];
  const ys = [y0, y1, y2, y3, y4];
  const blurs = [b0, b1, b2, b3, b4];

  return (
    <motion.div className="w-full max-w-6xl flex flex-col items-center gap-12" style={{ position: 'relative' }}>
      {/* Spacer to ensure sticky text does not overlap hero on smaller viewports */}
  <div className="w-full h-[32vh] md:h-[18vh]" aria-hidden />
      {/* Sticky scroll-reveal sentence */}
      <div className="relative w-full" style={{ minHeight: '60vh' }}>
        <div ref={stickyRef} className="sticky top-24 md:top-32 w-full flex flex-col items-center select-none" style={{ pointerEvents: 'none' }}>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-3 text-center text-[clamp(1.15rem,4.2vw,1.9rem)] font-[500] tracking-tight leading-tight px-4" style={{ fontFamily: 'Raleway, var(--font-sans, sans-serif)' }}>
    {segments.map(({ text, accent }, i) => (
              <motion.span
                key={i}
                style={{
      opacity: opacities[i] as any,
      transform: ys[i] && (ys[i] as any).to ? (ys[i] as any).to((v: number) => `translate3d(0, ${v}px, 0)`) : undefined,
      filter: blurs[i] && (blurs[i] as any).to ? (blurs[i] as any).to((b: number) => `blur(${b}px)`) : undefined,
                }}
                className={`transition-[opacity,filter,transform] duration-500 will-change-transform will-change-filter`}
              >
                {accent ? (
                  <GradientText
                    animationSpeed={6}
                    colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                    className="px-1"
                  >{text}</GradientText>
                ) : text}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Preview panel appears after sticky section */}
      <motion.div
        className="w-full max-w-6xl flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.1 }}
        style={{ position: 'relative' }}
      >
      <div className="w-full bg-[#3a384b] rounded-xl border border-white/10 shadow-2xl shadow-black/40 flex flex-col">
        {/* Mock Toolbar */}
        <div className="flex items-center p-3 border-b border-white/10">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
        </div>

        {/* Mock 3-Pane Debugger */}
  <div className="flex flex-col md:grid md:grid-cols-[280px_1fr_280px] h-[350px] md:h-[500px] p-2 gap-2 overflow-x-auto">
          {/* 1. Code Editor */}
          <div className="bg-gray-800/60 rounded-md p-3 font-mono text-sm text-white/60 overflow-auto">
            <div className="text-white/80 mb-2 text-xs">fibonacci.js</div>
            <div className="space-y-1">
              <div><span className="text-purple-400">function</span> <span className="text-blue-400">fibonacci</span><span className="text-white">(</span><span className="text-orange-400">n</span><span className="text-white">) {'{'}</span></div>
              <div className="bg-cyan-500/20 border-l-4 border-cyan-400 pl-2"><span className="text-purple-400">  if</span> <span className="text-white">(</span><span className="text-orange-400">n</span> <span className="text-white">&lt;= </span><span className="text-green-400">1</span><span className="text-white">) </span><span className="text-purple-400">return</span> <span className="text-orange-400">n</span><span className="text-white">;</span></div>
              <div><span className="text-purple-400">  return</span> <span className="text-blue-400">fibonacci</span><span className="text-white">(</span><span className="text-orange-400">n</span> <span className="text-white">- </span><span className="text-green-400">1</span><span className="text-white">) + </span><span className="text-blue-400">fibonacci</span><span className="text-white">(</span><span className="text-orange-400">n</span> <span className="text-white">- </span><span className="text-green-400">2</span><span className="text-white">);</span></div>
              <div><span className="text-white">{'}'}</span></div>
              <div className="pt-2"><span className="text-purple-400">const</span> <span className="text-orange-400">result</span> <span className="text-white">= </span><span className="text-blue-400">fibonacci</span><span className="text-white">(</span><span className="text-green-400">5</span><span className="text-white">);</span></div>
              <div><span className="text-blue-400">console</span><span className="text-white">.</span><span className="text-blue-400">log</span><span className="text-white">(</span><span className="text-orange-400">result</span><span className="text-white">);</span></div>
            </div>
          </div>
          {/* 2. Timeline Scrubber */}
          <div className="bg-gray-800/60 rounded-md p-3 text-sm text-white/60 overflow-auto">
            <div className="text-white/80 mb-3 text-xs flex items-center gap-2">
              <span>Timeline Scrubber</span>
              <div className="flex-1 bg-gray-700 rounded-full h-1">
                <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-1 rounded-full w-[30%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2 bg-purple-500/20 border border-purple-400/40 rounded text-xs">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1 animate-pulse"></div>
                <div>
                  <div className="text-cyan-400 font-medium">Condition • 2ms</div>
                  <div className="text-white/90">Check if n &lt;= 1 (false)</div>
                  <div className="text-white/60">Line 2</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-gray-700/30 rounded text-xs opacity-75">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1"></div>
                <div>
                  <div className="text-cyan-400 font-medium">Call • 1ms</div>
                  <div className="text-white/90">fibonacci(5) called</div>
                  <div className="text-white/60">Line 6</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-gray-800/30 rounded text-xs opacity-60">
                <div className="w-2 h-2 rounded-full bg-gray-600 mt-1"></div>
                <div>
                  <div className="text-cyan-400 font-medium">Declaration • 0ms</div>
                  <div className="text-white/90">Function fibonacci declared</div>
                  <div className="text-white/60">Line 1</div>
                </div>
              </div>
            </div>
          </div>
          {/* 3. Variables Panel */}
          <div className="bg-gray-800/60 rounded-md p-3 text-sm text-white/60 overflow-auto">
            <div className="text-white/80 mb-3 text-xs">Scope Variables</div>
            <div className="space-y-3">
              <div className="bg-gray-700/50 rounded p-3 border border-gray-600/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400 font-medium">n</span>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">number</span>
                </div>
                <div className="text-lg font-mono text-white font-semibold">5</div>
                <div className="text-xs text-gray-500 mt-1">Current scope value</div>
              </div>
              <div className="bg-gray-700/30 rounded p-3 border border-gray-600/30 opacity-75">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400 font-medium">result</span>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">undefined</span>
                </div>
                <div className="text-lg font-mono text-white/60 font-semibold">undefined</div>
                <div className="text-xs text-gray-500 mt-1">Pending execution</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      </motion.div>
    </motion.div>
  );
}