"use client";

import { motion } from "framer-motion";
import { Play, Eye, Zap } from "lucide-react";
import React from "react";

const benefits = [
  {
    icon: <Play className="w-10 h-10 text-[#2A8DCC]" />, // light sky deep blue
    title: "Visual Debugging",
    description: "Step through your code execution like a movie. See every variable change in real-time.",
  },
  {
    icon: <Eye className="w-10 h-10 text-[#2A8DCC]" />,
    title: "Timeline Scrubber",
    description: "Scrub back and forth through execution history. Never lose track of your program flow.",
  },
  {
    icon: <Zap className="w-10 h-10 text-[#2A8DCC]" />,
    title: "Live Variables",
    description: "Watch variables update in real-time. Understand scope and state changes instantly.",
  },
];

export function BenefitRow() {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 15 } },
  };

  return (
    <section className="py-24 flex justify-center items-center">
      <motion.div
        className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center text-center p-8 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm shadow-lg shadow-black/20"
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.03, transition: { type: 'spring', stiffness: 300, damping: 10 } }}
          >
            <div className="mb-5">{benefit.icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
            <p className="text-white/80 text-balance">{benefit.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}