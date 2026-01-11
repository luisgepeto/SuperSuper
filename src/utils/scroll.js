export const scrollIntoView = (element, options = {}) => {
  if (!element) return;
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  element.scrollIntoView({ 
    behavior: prefersReducedMotion ? 'instant' : 'smooth', 
    block: options.block || 'start',
    inline: options.inline || 'nearest',
  });
};

export const scrollToTop = (element, prefersReducedMotion = false) => {
  if (!element) return;
  
  element.scrollTo({
    top: 0,
    behavior: prefersReducedMotion ? 'instant' : 'smooth',
  });
};
