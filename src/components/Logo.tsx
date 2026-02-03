import { motion } from 'framer-motion';

export function Logo({ className = "" }: { className?: string }) {
  return (
    <motion.div 
      className={`font-serif ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] gradient-gold-text whitespace-nowrap">
        NINA ARMEND
      </h1>
      <p className="hidden sm:block text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.5em] text-muted-foreground uppercase mt-1">
        Brazilian Swimwear
      </p>
    </motion.div>
  );
}
