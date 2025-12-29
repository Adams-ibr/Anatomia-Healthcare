import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          <div className="flex flex-col items-center gap-8">
            {/* Anatomy-themed logo with heartbeat animation */}
            <div className="relative">
              {/* Outer pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/30"
                style={{ width: 120, height: 120, left: -10, top: -10 }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Inner pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/50"
                style={{ width: 100, height: 100 }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0.2, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
              />

              {/* Anatomical heart SVG */}
              <motion.svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                className="text-primary"
                animate={{
                  scale: [1, 1.05, 1, 1.08, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Stylized anatomical heart */}
                <motion.path
                  d="M50 85 C20 60 10 40 15 28 C20 16 35 12 50 25 C65 12 80 16 85 28 C90 40 80 60 50 85Z"
                  fill="currentColor"
                  opacity="0.9"
                />
                {/* Aorta */}
                <motion.path
                  d="M45 25 C45 15 40 8 35 5 M55 25 C55 15 60 8 65 5"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Ventricle line */}
                <motion.path
                  d="M50 35 L50 55"
                  stroke="hsl(var(--background))"
                  strokeWidth="2"
                  opacity="0.5"
                />
                {/* Cross veins */}
                <motion.path
                  d="M35 45 C45 45 55 45 65 45"
                  stroke="hsl(var(--background))"
                  strokeWidth="1.5"
                  opacity="0.3"
                />
              </motion.svg>
            </div>

            {/* Brand name */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Anatomia
              </h1>
              <p className="text-sm text-muted-foreground">
                Medical Education Platform
              </p>
            </motion.div>

            {/* ECG/Heartbeat line */}
            <div className="w-48 h-12 overflow-hidden">
              <motion.svg
                width="200"
                height="50"
                viewBox="0 0 200 50"
                className="text-primary"
              >
                <motion.path
                  d="M0 25 L30 25 L40 25 L45 10 L50 40 L55 5 L60 45 L65 20 L70 25 L100 25 L130 25 L140 25 L145 10 L150 40 L155 5 L160 45 L165 20 L170 25 L200 25"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.svg>
            </div>

            {/* Loading dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
