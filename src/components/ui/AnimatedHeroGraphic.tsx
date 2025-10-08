'use client';
import { motion } from 'framer-motion';

const scrubberVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.5, ease: 'easeInOut' },
  },
};

const braceVariants = {
  hidden: { scale: 0.5, opacity: 0, rotate: -15 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      delay: 1,
      duration: 0.8,
      type: 'spring',
      stiffness: 100,
    },
  },
};

export function AnimatedHeroGraphic() {
  return (
    <div className="relative w-full h-24">
      <motion.svg
        viewBox="0 0 300 100"
        className="absolute inset-0 w-full h-full"
        initial="hidden"
        animate="visible"
        key="scrubber"
      >
        {/* Timeline */}
        <motion.line
          x1="20"
          y1="50"
          x2="280"
          y2="50"
          stroke="#88f9b5"
          strokeWidth="2"
          variants={scrubberVariants}
        />
        {/* Ticks */}
        {[...Array(5)].map((_, i) => (
          <motion.line
            key={i}
            x1={60 + i * 40}
            y1="45"
            x2={60 + i * 40}
            y2="55"
            stroke="#88f9b5"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.2 }}
          />
        ))}
        {/* Scrubber Handle */}
        <motion.path
          d="M145 42L150 50L145 58L140 50Z"
          fill="#88f9b5"
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            delay: 0.8,
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      </motion.svg>

      <motion.svg
        viewBox="0 0 300 100"
        className="absolute inset-0 w-full h-full"
        initial="hidden"
        animate="visible"
        key="braces"
      >
        {/* Left Brace */}
        <motion.path
          d="M80 20 C 40 30, 40 70, 80 80"
          stroke="#FDD158"
          strokeWidth="3"
          fill="none"
          variants={braceVariants}
        />
        {/* Right Brace */}
        <motion.path
          d="M220 20 C 260 30, 260 70, 220 80"
          stroke="#FDD158"
          strokeWidth="3"
          fill="none"
          variants={braceVariants}
        />
      </motion.svg>
    </div>
  );
}