import { motion } from 'framer-motion';

export function Logo({ className = "" }: { className?: string }) {
  return (
    <motion.div 
      className={`font-serif ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-2xl md:text-3xl font-light tracking-[0.3em] gradient-gold-text">
        NINA ARMEND
      </h1>
      <p className="text-[10px] md:text-xs tracking-[0.5em] text-muted-foreground uppercase mt-1">
        Brazilian Swimwear
      </p>
    </motion.div>
  );
}
