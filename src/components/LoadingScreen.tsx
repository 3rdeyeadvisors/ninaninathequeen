import { motion } from "framer-motion";

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center">
        <h1 className="font-serif text-xl tracking-[0.4em] bg-gradient-to-r from-primary/30 via-primary to-primary/30 bg-[length:200%_100%] animate-shimmer-luxury bg-clip-text text-transparent">
          NINA ARMEND
        </h1>

        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="text-primary/40 text-xl font-bold"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            >
              ·
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
};
