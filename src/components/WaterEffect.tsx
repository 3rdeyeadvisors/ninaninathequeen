import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface BubbleProps {
  id: number;
}

const Bubble: React.FC<BubbleProps> = ({ id }) => {
  const style = useMemo(() => ({
    '--duration': `${3 + Math.random() * 4}s`,
    '--drift': `${(Math.random() - 0.5) * 150}px`,
    left: `${Math.random() * 100}%`,
    width: `${8 + Math.random() * 20}px`,
    height: `${8 + Math.random() * 20}px`,
    animationDelay: `${Math.random() * 3}s`,
  } as React.CSSProperties), []);

  return <div className="bubble" style={style} />;
};

const SplashBlob: React.FC<{ delay: number; index: number }> = ({ delay, index }) => {
  const randomX = useMemo(() => (Math.random() - 0.5) * 150, []);
  const randomY = useMemo(() => (Math.random() - 0.5) * 150, []);
  const randomScale = useMemo(() => 2 + Math.random() * 2, []);

  const variants = {
    initial: { scale: 0, opacity: 0, x: '-50%', y: '-50%' },
    animate: {
      scale: [0, randomScale, randomScale * 1.5],
      opacity: [0, 0.8, 0],
      x: ['-50%', `${-50 + randomX}%`],
      y: ['-50%', `${-50 + randomY}%`],
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.8, delay, ease: "circOut" }}
      className="absolute top-1/2 left-1/2 w-[40vw] h-[40vw] bg-blue-500/40 rounded-full"
    />
  );
};

const WaterWaves: React.FC = () => (
  <div className="absolute top-0 left-0 w-full h-[120px] overflow-visible pointer-events-none" style={{ transform: 'translateY(-50%)' }}>
    {/* Surface foam/glimmer */}
    <div className="absolute top-1/2 left-0 w-[200%] h-16 bg-white/30 blur-3xl animate-wave-medium opacity-40 -translate-y-1/2" />

    <svg className="absolute inset-0 w-[200%] h-full fill-blue-500/40 animate-wave-slow" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path d="M0,50 C150,100 350,0 500,50 C650,100 850,0 1000,50 L1000,100 L0,100 Z" />
    </svg>
    <svg className="absolute inset-0 w-[200%] h-[90%] fill-blue-400/30 animate-wave-fast left-[-50%] top-[5%]" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path d="M0,50 C150,0 350,100 500,50 C650,0 850,100 1000,50 L1000,100 L0,100 Z" />
    </svg>
    <svg className="absolute inset-0 w-[200%] h-[80%] fill-blue-600/50 animate-wave-medium left-[-25%] top-[10%]" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path d="M0,50 C150,80 350,20 500,50 C650,80 850,20 1000,50 L1000,100 L0,100 Z" />
    </svg>
  </div>
);

export const WaterEffect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDraining, setIsDraining] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const location = useLocation();
  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {
    const visited = sessionStorage.getItem('nina-armend-initial-drain');
    if (!visited) {
      setIsDraining(true);
      setHasVisited(false);
      sessionStorage.setItem('nina-armend-initial-drain', 'true');

      const timer = setTimeout(() => {
        setIsDraining(false);
        setHasVisited(true);
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      setHasVisited(true);
    }
  }, []);

  useEffect(() => {
    if (hasVisited) {
      setShowSplash(true);
      const timer = setTimeout(() => setShowSplash(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, hasVisited]);

  useEffect(() => {
    if (isDraining) {
      document.body.classList.add('underwater');
    } else {
      document.body.classList.remove('underwater');
    }
  }, [isDraining]);

  const bubbles = useMemo(() => Array.from({ length: 30 }, (_, i) => i), []);

  return (
    <>
      <div className={isDraining ? 'underwater' : ''}>
        {children}
      </div>

      <AnimatePresence>
        {isDraining && (
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: '100%' }}
            exit={{ y: '100%' }}
            transition={{ duration: 4, ease: [0.45, 0, 0.55, 1] }}
            className="fixed inset-0 z-[9999] pointer-events-none"
          >
            <div className="absolute inset-0 water-overlay overflow-visible">
              <div className="absolute inset-0 overflow-hidden">
                {bubbles.map(id => (
                  <Bubble key={id} id={id} />
                ))}
              </div>
              <WaterWaves />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center overflow-hidden"
          >
            <div className="relative w-full h-full" style={{ filter: 'url(#splash-filter)' }}>
              {[...Array(12)].map((_, i) => (
                <SplashBlob key={i} index={i} delay={i * 0.03} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
