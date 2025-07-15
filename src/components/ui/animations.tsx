import { motion } from "framer-motion";

export const FadeIn = ({ children , delay = 0, duration = 0.5 }: { children: React.ReactNode, delay?: number, duration?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay }}
  >
    {children}
  </motion.div>
);

export const SlideIn = ({ children, direction = "left", delay = 0 }: { children: React.ReactNode, direction?: "left" | "right" | "up" | "down", delay?: number }) => {
  const directionMap = {
    left: { x: -50 },
    right: { x: 50 },
    up: { y: 50 },
    down: { y: -50 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

export const Hover = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
); 