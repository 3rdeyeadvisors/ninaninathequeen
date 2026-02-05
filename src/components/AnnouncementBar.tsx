
import { motion } from 'framer-motion';

export const AnnouncementBar = () => {
  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden flex whitespace-nowrap">
      <motion.div
        animate={{
          x: [0, "-50%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="flex items-center"
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center shrink-0">
            <span className="text-[9px] md:text-[10px] font-sans tracking-[0.25em] uppercase font-bold px-8">
              FREE SHIPPING ON ALL ORDERS OF 2 BIKINI SETS OR MORE
            </span>
            <span className="text-[10px] md:text-xs font-sans px-4">•</span>
            <span className="text-[9px] md:text-[10px] font-sans tracking-[0.25em] uppercase font-bold px-8">
              BRAZILIAN LUXURY SWIMWEAR
            </span>
            <span className="text-[10px] md:text-xs font-sans px-4">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
