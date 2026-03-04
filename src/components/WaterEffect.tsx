import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const Bubble: React.FC<{ index: number }> = ({ index }) => {
  const vars = useMemo(() => {
    const rand = Math.random();
    const size = 5 + Math.random() * 13;
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 4;
    const riseFull = -(80 + Math.random() * 20);
    const driftFull = (Math.random() - 0.5) * 200;

    return {
      '--duration': `${duration}s`,
      '--delay': `${delay}s`,
      '--rise-half': `${riseFull * 0.5}vh`,
      '--rise-full': `${riseFull}vh`,
      '--drift-half': `${driftFull * 0.4}px`,
      '--drift-full': `${driftFull}px`,
      '--wobble': 0.9 + Math.random() * 0.2,
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: `${size}px`,
      bottom: '-20px',
    } as React.CSSProperties;
  }, []);

  return <div className="bubble" style={vars} />;
};

const Droplet: React.FC<{ index: number }> = ({ index }) => {
  const config = useMemo(() => {
    const angle = (Math.random() - 0.5) * Math.PI * 0.8;
    const force = 150 + Math.random() * 200;
    const targetX = Math.sin(angle) * force;
    const height = 150 + Math.random() * 250;
    const duration = 0.7 + Math.random() * 0.4;
    const size = 8 + Math.random() * 14;
    const delay = Math.random() * 0.15;

    return { targetX, height, duration, size, delay };
  }, []);

  return (
    <motion.div
      className="droplet"
      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
      animate={{
        x: [0, config.targetX * 0.6, config.targetX],
        y: [0, -config.height, 200],
        scale: [0, 1.2, 0.7],
        opacity: [1, 1, 0],
        scaleY: [1, 1.8, 1],
      }}
      transition={{
        duration: config.duration,
        delay: config.delay,
        times: [0, 0.4, 1],
        ease: [[0.2, 0, 0.8, 1], [0, 0, 1, 1]],
      }}
      style={{
        left: '50%',
        bottom: '0',
        width: config.size,
        height: config.size,
      }}
    />
  );
};

const Ripple: React.FC<{ index: number }> = ({ index }) => {
  const vars = useMemo(() => ({
    '--r-scale': 4 + Math.random() * 10,
    '--r-dur': `${0.5 + Math.random() * 0.8}s`,
    animationDelay: `${index * 0.12}s`,
    width: `${30 + Math.random() * 40}px`,
    height: `${15 + Math.random() * 20}px`,
  } as React.CSSProperties), [index]);

  return <div className="ripple-ring" style={vars} />;
};

const WaterWaves: React.FC = () => (
  <div className="water-surface">
    <div className="foam-layer" />

    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="glint"
        style={{
          '--g-dur': `${4 + Math.random() * 4}s`,
          '--g-delay': `${Math.random() * 6}s`,
          top: `${15 + i * 8}px`
        } as React.CSSProperties}
      />
    ))}

    <svg className="absolute top-0 left-[-50%] w-[200%] h-[120px]" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path
        className="animate-wave-medium opacity-40 fill-blue-400"
        d="M0,40 C150,90 350,0 500,40 C650,90 850,0 1000,40 L1000,100 L0,100 Z"
      />
      <path
        className="animate-wave-slow opacity-30 fill-blue-300"
        style={{ transform: 'translateX(-15%)' }}
        d="M0,50 C200,100 400,0 600,50 C800,100 1000,0 1200,50 L1200,100 L0,100 Z"
      />
      <path
        className="animate-wave-fast opacity-50 fill-blue-600"
        style={{ transform: 'translateX(-30%)' }}
        d="M0,60 C150,30 350,90 500,60 C650,30 850,90 1000,60 L1000,100 L0,100 Z"
      />
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
      const timer = setTimeout(() => setShowSplash(false), 1500);
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

  const vortexRings = useMemo(() => [...Array(6)].map((_, i) => ({
    dur: `${2 - i * 0.3}s`,
    scale: 1 - i * 0.15,
    op: 0.2 + i * 0.05,
    dir: i % 2 === 0 ? 1 : -1
  })), []);

  return (
    <>
      <div className={isDraining ? 'underwater' : ''}>
        {children}
      </div>

      <AnimatePresence mode="wait">
        {isDraining && (
          <motion.div
            key="drain"
            initial={{ y: 0 }}
            animate={{ y: '100%' }}
            exit={{ y: '100%' }}
            transition={{ duration: 4, ease: [0.4, 0, 0.8, 1] }}
            className="fixed inset-0 z-[9999] pointer-events-none"
          >
            <div className="water-body" />
            <div className="caustic-layer" />

            <div className="absolute inset-0 overflow-hidden">
              {[...Array(40)].map((_, i) => (
                <Bubble key={i} index={i} />
              ))}
            </div>

            <WaterWaves />

            <div className="vortex-wrap">
              {vortexRings.map((ring, i) => (
                <div
                  key={i}
                  className="vortex-ring"
                  style={{
                    '--v-dur': ring.dur,
                    '--v-scale': ring.scale,
                    '--v-op': ring.op,
                    '--v-dir': ring.dir
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] pointer-events-none"
          >
            <div className="absolute inset-0" style={{ filter: 'url(#goo)' }}>
              {[...Array(18)].map((_, i) => (
                <Droplet key={i} index={i} />
              ))}
            </div>

            <div className="absolute left-1/2 bottom-[8px] translate-x-[-50%]">
              {[...Array(5)].map((_, i) => (
                <Ripple key={i} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
