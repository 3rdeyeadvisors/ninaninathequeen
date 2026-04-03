import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { playPageTransition } from '@/lib/sounds';
import { useEffect } from 'react';

export function PageTransition() {
  const location = useLocation();

  useEffect(() => {
    // Play the transition sound on every route change
    playPageTransition();
  }, [location.pathname]);

  return (
    <motion.div
      key={location.pathname}
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{
        background: 'hsl(var(--background))',
      }}
      initial={{ x: '-100%' }}
      animate={{ x: ['-100%', '0%', '0%', '100%'] }}
      transition={{
        duration: 1.2,
        times: [0, 0.4, 0.6, 1],
        ease: [0.76, 0, 0.24, 1]
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.9, 1.05, 1.05, 0.9],
        }}
        transition={{
          duration: 1.2,
          times: [0, 0.4, 0.6, 1],
          ease: "easeInOut"
        }}
      >
        <Logo />
      </motion.div>
    </motion.div>
  );
}
