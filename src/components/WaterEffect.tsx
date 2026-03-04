import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const Bubble: React.FC<{ index: number }> = ({ index }) => {
  const cfg = useMemo(() => ({
    size: 5 + Math.random() * 14,
    duration: 2.5 + Math.random() * 3.5,
    delay: Math.random() * 3.5,
    startX: Math.random() * 100,
    driftX: (Math.random() - 0.5) * 180,
    wobble: 0.88 + Math.random() * 0.24,
    repeatDelay: Math.random() * 1.5,
  }), []);

  return (
    <motion.div
      initial={{ y: 0, x: 0, opacity: 0, scale: 1 }}
      animate={{
        y: [0, '-45vh', '-90vh'],
        x: [0, cfg.driftX * 0.45, cfg.driftX],
        opacity: [0, 0.85, 0.7, 0],
        scale: [1, cfg.wobble, 1],
      }}
      transition={{
        duration: cfg.duration,
        delay: cfg.delay,
        repeat: Infinity,
        repeatDelay: cfg.repeatDelay,
        ease: 'easeIn',
        times: [0, 0.5, 1],
      }}
      style={{
        position: 'absolute',
        bottom: '-10px',
        left: `${cfg.startX}%`,
        width: cfg.size,
        height: cfg.size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(180,230,255,0.4) 45%, rgba(100,180,255,0.12) 100%)',
        boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.5), inset 1px 1px 3px rgba(255,255,255,0.7), 0 0 8px rgba(120,210,255,0.35)',
        pointerEvents: 'none',
      }}
    />
  );
};

const VortexRing: React.FC<{ index: number; total: number }> = ({ index, total }) => {
  const cfg = useMemo(() => {
    const progress = index / (total - 1);
    const baseSize = 200 - progress * 160;
    const duration = 2.2 - progress * 1.6;
    const dir = index % 2 === 0 ? 1 : -1;
    const opacity = 0.12 + progress * 0.22;
    return { baseSize, duration, dir, opacity };
  }, [index, total]);

  return (
    <motion.div
      animate={{
        rotate: cfg.dir > 0 ? [0, 720] : [0, -720],
        scale: [1, 0.02],
        opacity: [cfg.opacity, 0],
      }}
      transition={{ duration: cfg.duration, repeat: Infinity, ease: 'easeIn' }}
      style={{
        position: 'absolute',
        width: cfg.baseSize,
        height: cfg.baseSize * 0.45,
        borderRadius: '50%',
        border: '1.5px solid rgba(180,230,255,0.6)',
        top: '50%',
        left: '50%',
        marginLeft: -cfg.baseSize / 2,
        marginTop: -(cfg.baseSize * 0.45) / 2,
        transformOrigin: 'center center',
        pointerEvents: 'none',
      }}
    />
  );
};

const WavePath: React.FC<{ d: string; fill: string; opacity: number; duration: number; startX: number }> = ({ d, fill, opacity, duration, startX }) => (
  <motion.svg
    viewBox="0 0 1000 80"
    preserveAspectRatio="none"
    style={{ position: 'absolute', top: 0, left: `${startX}%`, width: '200%', height: '100%', fill, opacity }}
    animate={{ x: [0, '-50%'] }}
    transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
  >
    <path d={d} />
  </motion.svg>
);

const WaterSurface: React.FC = () => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 110, overflow: 'visible', transform: 'translateY(-52px)', pointerEvents: 'none' }}>
    <motion.div
      animate={{ scaleX: [1, 1.03, 1], opacity: [0.2, 0.32, 0.2] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'absolute', top: 38, left: '-8%', right: '-8%', height: 24, background: 'rgba(255,255,255,0.22)', borderRadius: '50%', filter: 'blur(10px)' }}
    />
    {[0, 1, 2, 3].map((i) => (
      <motion.div
        key={i}
        animate={{ left: ['-25%', '115%'], opacity: [0, 0.9, 0.8, 0] }}
        transition={{ duration: 4 + i * 1.2, delay: i * 1.8, repeat: Infinity, repeatDelay: 2 + i * 0.8, ease: 'linear', times: [0, 0.08, 0.92, 1] }}
        style={{ position: 'absolute', top: 20 + i * 7, height: 3, width: 90 + i * 20, borderRadius: 2, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)' }}
      />
    ))}
    <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <WavePath d="M0,40 C200,80 300,10 500,40 C700,70 800,5 1000,40 L1000,80 L0,80 Z" fill="rgba(100,190,255,0.45)" opacity={1} duration={9} startX={0} />
      <WavePath d="M0,50 C150,10 350,80 500,50 C650,20 850,80 1000,50 L1000,80 L0,80 Z" fill="rgba(60,150,240,0.35)" opacity={1} duration={13} startX={-20} />
      <WavePath d="M0,35 C250,70 400,0 600,35 C800,70 900,10 1000,35 L1000,80 L0,80 Z" fill="rgba(30,100,200,0.55)" opacity={1} duration={7} startX={-40} />
    </div>
  </div>
);

const Droplet: React.FC<{ index: number }> = ({ index }) => {
  const cfg = useMemo(() => {
    const angle = (Math.random() - 0.5) * Math.PI * 0.85;
    const force = 120 + Math.random() * 220;
    return {
      tx: Math.sin(angle) * force,
      peakY: -(100 + Math.random() * 260),
      landY: 60 + Math.random() * 80,
      duration: 0.65 + Math.random() * 0.5,
      size: 7 + Math.random() * 13,
      delay: index * 0.025 + Math.random() * 0.06,
    };
  }, []);

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0, opacity: 1, scaleY: 1 }}
      animate={{
        x: [0, cfg.tx * 0.55, cfg.tx],
        y: [0, cfg.peakY, cfg.landY],
        scale: [0, 1, 0.6],
        opacity: [1, 1, 0],
        scaleY: [1, 1.9, 1.1],
      }}
      transition={{ duration: cfg.duration, delay: cfg.delay, ease: [0.15, 0, 0.75, 1], times: [0, 0.38, 1] }}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 0,
        width: cfg.size,
        height: cfg.size,
        marginLeft: -cfg.size / 2,
        borderRadius: '50% 50% 48% 48% / 60% 60% 40% 40%',
        background: 'radial-gradient(circle at 33% 33%, rgba(255,255,255,0.95), rgba(130,210,255,0.7) 45%, rgba(30,120,230,0.35) 100%)',
        boxShadow: '0 0 10px rgba(100,200,255,0.5)',
        pointerEvents: 'none',
      }}
    />
  );
};

const RippleRing: React.FC<{ index: number }> = ({ index }) => {
  const cfg = useMemo(() => ({
    size: 24 + index * 14,
    scale: 4 + index * 2.5,
    duration: 0.45 + index * 0.18,
    delay: index * 0.1,
  }), [index]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0.8 }}
      animate={{ scale: cfg.scale, opacity: 0 }}
      transition={{ duration: cfg.duration, delay: cfg.delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 4,
        width: cfg.size,
        height: cfg.size * 0.45,
        marginLeft: -cfg.size / 2,
        borderRadius: '50%',
        border: '1.5px solid rgba(100,200,255,0.55)',
        transformOrigin: 'center center',
        pointerEvents: 'none',
      }}
    />
  );
};

export const WaterEffect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDraining, setIsDraining] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const location = useLocation();
  const [hasVisited, setHasVisited] = useState(false);
  const splashKey = useRef(0);
  const bubbles = useMemo(() => Array.from({ length: 42 }, (_, i) => i), []);
  const VORTEX_COUNT = 7;

  useEffect(() => {
    const visited = sessionStorage.getItem('nina-armend-initial-drain');
    if (!visited) {
      setIsDraining(true);
      sessionStorage.setItem('nina-armend-initial-drain', 'true');
      const t = setTimeout(() => { setIsDraining(false); setHasVisited(true); }, 4200);
      return () => clearTimeout(t);
    } else {
      setHasVisited(true);
    }
  }, []);

  useEffect(() => {
    if (!hasVisited) return;
    splashKey.current += 1;
    setShowSplash(true);
    const t = setTimeout(() => setShowSplash(false), 1600);
    return () => clearTimeout(t);
  }, [location.pathname, hasVisited]);

  useEffect(() => {
    if (isDraining) {
      document.body.classList.add('is-underwater');
    } else {
      document.body.classList.remove('is-underwater');
    }
  }, [isDraining]);

  return (
    <>
      <div className={isDraining ? 'is-underwater' : ''}>{children}</div>

      <AnimatePresence>
        {isDraining && (
          <motion.div key="drain" style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', overflow: 'visible' }}>
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: '102%' }}
              transition={{ duration: 4.1, ease: [0.35, 0, 0.9, 1] }}
              style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(140,220,255,0.18) 0%, rgba(0,90,180,0.6) 38%, rgba(0,35,90,0.88) 100%)', backdropFilter: 'blur(3px)' }} />
              <motion.div
                animate={{ scale: [1, 1.04, 1], x: [0, '1%', 0], y: [0, '0.5%', 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 58% 28% at 22% 28%, rgba(255,255,255,0.09) 0%, transparent 70%), radial-gradient(ellipse 38% 18% at 72% 58%, rgba(255,255,255,0.07) 0%, transparent 70%)', filter: 'url(#caustics)', mixBlendMode: 'screen' }}
              />
              <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                {bubbles.map((i) => <Bubble key={i} index={i} />)}
              </div>
              <WaterSurface />
              <div style={{ position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)', width: 200, height: 120, pointerEvents: 'none' }}>
                {Array.from({ length: VORTEX_COUNT }, (_, i) => <VortexRing key={i} index={i} total={VORTEX_COUNT} />)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSplash && (
          <motion.div
            key={`splash-${splashKey.current}`}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 1.1 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}
          >
            <div style={{ position: 'absolute', inset: 0, filter: 'url(#goo)' }}>
              {Array.from({ length: 20 }, (_, i) => <Droplet key={i} index={i} />)}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 0 }}>
              {Array.from({ length: 5 }, (_, i) => <RippleRing key={i} index={i} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
