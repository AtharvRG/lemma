'use client';
import { motion } from 'framer-motion';

export function Animated404() {
  return (
    <motion.svg
      viewBox="0 0 400 100"
      className="w-full max-w-md h-auto"
      initial="broken"
      whileHover="together"
      animate="broken"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Left part of the timeline */}
      <motion.g
        variants={{
          broken: { x: 0, y: 0, rotate: -3 },
          together: { x: 20, y: 5, rotate: 0 },
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <line x1="50" y1="50" x2="180" y2="50" stroke="#88f9b5" strokeWidth="3" />
        <line x1="100" y1="45" x2="100" y2="55" stroke="#88f9b5" strokeWidth="3" />
        <line x1="150" y1="45" x2="150" y2="55" stroke="#88f9b5" strokeWidth="3" />
      </motion.g>

      {/* Right part of the timeline */}
      <motion.g
        variants={{
          broken: { x: 0, y: 0, rotate: 2 },
          together: { x: -20, y: -5, rotate: 0 },
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <line x1="220" y1="50" x2="350" y2="50" stroke="#88f9b5" strokeWidth="3" />
        <line x1="250" y1="45" x2="250" y2="55" stroke="#88f9b5" strokeWidth="3" />
        <line x1="300" y1="45" x2="300" y2="55" stroke="#88f9b5" strokeWidth="3" />
      </motion.g>

      {/* 404 Text */}
      <motion.text
        x="200"
        y="58"
        fontFamily="monospace"
        fontSize="50"
        fill="#FDD158"
        textAnchor="middle"
        filter="url(#glow)"
        variants={{
          broken: { opacity: 0, scale: 0.8 },
          together: { opacity: 1, scale: 1 },
        }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        404
      </motion.text>
    </motion.svg>
  );
}