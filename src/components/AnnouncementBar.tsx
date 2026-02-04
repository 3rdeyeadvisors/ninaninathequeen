
import { motion } from 'framer-motion';

export const AnnouncementBar = () => {
  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden">
      <motion.div
        animate={{
          x: [0, -100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="whitespace-nowrap flex justify-center items-center"
      >
        <span className="text-[10px] md:text-xs font-sans tracking-[0.2em] uppercase font-bold px-4">
          FREE SHIPPING ON ALL ORDERS OF 2 BIKINI SETS OR MORE
        </span>
        <span className="text-[10px] md:text-xs font-sans tracking-[0.2em] uppercase font-bold px-4 hidden md:inline">
          •
        </span>
        <span className="text-[10px] md:text-xs font-sans tracking-[0.2em] uppercase font-bold px-4 hidden md:inline">
          BRAZILIAN LUXURY SWIMWEAR
        </span>
        <span className="text-[10px] md:text-xs font-sans tracking-[0.2em] uppercase font-bold px-4 hidden md:inline">
          •
        </span>
        <span className="text-[10px] md:text-xs font-sans tracking-[0.2em] uppercase font-bold px-4 hidden md:inline">
          FREE SHIPPING ON ALL ORDERS OF 2 BIKINI SETS OR MORE
        </span>
      </motion.div>
    </div>
  );
};
