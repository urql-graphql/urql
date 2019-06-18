export const isSSR =
  typeof window === 'undefined' || !('HTMLElement' in window);
