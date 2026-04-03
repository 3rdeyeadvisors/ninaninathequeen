import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { playPageTransition } from '@/lib/sounds';
import { useEffect } from 'react';

export function PageTransition() {
  const location = useLocation();

  useEffect(() => {
    playPageTransition();
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--gold)), hsl(var(--gold-light)), hsl(var(--gold)), transparent)',
        }}
        initial={{ scaleX: 0, opacity: 1, transformOrigin: 'left center' }}
        animate={{ scaleX: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
      />
    </AnimatePresence>
  );
}
