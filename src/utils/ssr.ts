export const isSSR =
  typeof window === 'undefined' ||
  // @ts-ignore
  window.document === 'undefined' ||
  // @ts-ignore
  window.document.createElement === 'undefined';
