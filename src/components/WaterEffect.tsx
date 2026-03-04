import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface BubbleProps {
  id: number;
}

const Bubble: React.FC<BubbleProps> = ({ id }) => {
  const style = useMemo(() => ({
    '--duration': `${5 + Math.random() * 5}s`,
    '--drift': `${(Math.random() - 0.5) * 100}px`,
    left: `${Math.random() * 100}%`,
    width: `${10 + Math.random() * 30}px`,
    height: `${10 + Math.random() * 30}px`,
    animationDelay: `${Math.random() * 5}s`,
  } as React.CSSProperties), []);

  return <div className="bubble" style={style} />;
};

export const WaterEffect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDraining, setIsDraining] = useState(false);
  const [showWash, setShowWash] = useState(false);
  const location = useLocation();
  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {
    const visited = sessionStorage.getItem('nina_armend_visited');
    if (!visited) {
      setIsDraining(true);
      setHasVisited(false);
      sessionStorage.setItem('nina_armend_visited', 'true');

      const timer = setTimeout(() => {
        setIsDraining(false);
        setHasVisited(true);
      }, 4000); // 4 seconds draining effect

      return () => clearTimeout(timer);
    } else {
      setHasVisited(true);
    }
  }, []);

  useEffect(() => {
    if (hasVisited) {
      setShowWash(true);
      const timer = setTimeout(() => setShowWash(false), 1000);
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

  const bubbles = useMemo(() => Array.from({ length: 20 }, (_, i) => i), []);

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
            className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
          >
            <div className="absolute inset-0 water-overlay">
              {bubbles.map(id => (
                <Bubble key={id} id={id} />
              ))}
              <svg className="wave-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M0,50 C20,40 40,60 60,50 C80,40 100,60 100,50 L100,100 L0,100 Z"
                  fill="rgba(255,255,255,0.1)"
                >
                  <animate
                    attributeName="d"
                    values="
                      M0,50 C20,40 40,60 60,50 C80,40 100,60 100,50 L100,100 L0,100 Z;
                      M0,50 C20,60 40,40 60,50 C80,60 100,40 100,50 L100,100 L0,100 Z;
                      M0,50 C20,40 40,60 60,50 C80,40 100,60 100,50 L100,100 L0,100 Z"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
            </div>
            {/* Water surface line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 blur-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWash && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            exit={{ x: '100%' }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent backdrop-blur-[2px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
