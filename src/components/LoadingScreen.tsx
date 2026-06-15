'use client';

import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] overflow-hidden">
      {/* Sphères décoratives */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-koko-orange/20 dark:bg-koko-orange/20 blur-[100px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-koko-orange/10 dark:bg-koko-orange/10 blur-[120px]" />

      {/* Logo K */}
      <motion.div
        className="relative z-10 flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-koko-orange to-koko-orange-dark shadow-2xl shadow-koko-orange/30"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <span className="text-5xl font-extrabold text-white select-none">K</span>
      </motion.div>

      {/* Points animés */}
      <motion.div
        className="mt-8 flex space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-3 h-3 rounded-full bg-koko-orange"
            animate={{
              y: [0, -12, 0],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* Texte */}
      <motion.p
        className="mt-6 text-sm text-gray-500 dark:text-gray-400 tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Préparation de votre espace...
      </motion.p>
    </div>
  );
}
