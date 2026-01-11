import { useMemo } from 'react';

export const usePrefersReducedMotion = () => {
  return useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
};
