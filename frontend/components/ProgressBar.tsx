import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  progress: number;
}

export default function ProgressBar({ progress }: Props) {
  return (
    <div className="w-full bg-black/40 rounded-full h-3 border border-white/10 overflow-hidden relative shadow-inner">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="h-full rounded-full bg-gradient-to-r from-brand-accent1 to-brand-accent2 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
      >
        <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]"></div>
      </motion.div>
    </div>
  );
}