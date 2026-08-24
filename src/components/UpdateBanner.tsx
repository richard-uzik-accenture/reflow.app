import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { Refresh } from './icons/Refresh';

const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
};

export function UpdateBanner() {
  const { needsRefresh, refresh } = useAppUpdate();
  const reducedMotion = useReducedMotion();

  if (!needsRefresh) return null;

  const transition = reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 260, damping: 30, mass: 0.9 };

  return (
    <motion.div
      className="update-banner"
      initial={slideUp.initial}
      animate={{ ...slideUp.animate, transition }}
      exit={{ ...slideUp.exit, transition: { duration: 0.18 } }}
    >
      <span className="update-banner-copy">a newer version of reflow is ready</span>
      <button className="update-banner-refresh" onClick={refresh}>
        <Refresh width={16} height={16} />
        refresh
      </button>
    </motion.div>
  );
}
