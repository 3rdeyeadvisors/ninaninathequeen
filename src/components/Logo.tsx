import { motion } from 'framer-motion';

export function Logo({ className = "" }: { className?: string }) {
  return (
    <motion.div 
      className={`font-serif flex flex-col items-center text-center ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="text-xl sm:text-xl md:text-2xl lg:text-4xl font-light tracking-[0.15em] sm:tracking-[0.3em] gradient-gold-text whitespace-nowrap">
        NINA ARMEND
      </h1>
      <div className="flex items-center gap-2 mt-1">
        <div className="h-[1px] w-4 md:w-8 bg-primary/30 hidden sm:block" />
        <p className="text-[8px] md:text-[10px] tracking-[0.4em] md:tracking-[0.6em] text-muted-foreground uppercase whitespace-nowrap">
          Brazilian Swimwear
        </p>
        <div className="h-[1px] w-4 md:w-8 bg-primary/30 hidden sm:block" />
      </div>
    </motion.div>
  );
}
