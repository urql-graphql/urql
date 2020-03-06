const systemFonts = [
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'Noto Sans',
  'sans-serif',
  'Apple Color Emoji',
  'Segoe UI Emoji',
  'Segoe UI Symbol',
  'Noto Color Emoji',
];

export const colors = {
  passiveBg: '#f2f2f2',
  codeBg: '#f0f7fb',
  bg: '#ffffff',
  border: '#ececec',
  activeBorder: '#a2b1ff',
  text: '#000000',
  heading: '#050617',
  accent: '#566ac8',
  code: '#403f53',
  passive: '#9999a6',
};

export const layout = {
  page: '144rem',
  header: '4.8rem',
  stripes: '1rem',
  sidebar: '28rem',
  legend: '22rem',
  logo: '12rem',
};

export const fonts = {
  heading: systemFonts.join(', '),
  body: systemFonts.join(', '),
  code: 'Space Mono, monospace',
};

export const fontSizes = {
  small: '0.9em',
  body: '1.8rem',
  code: '0.8em',
  h1: '3.45em',
  h2: '2.11em',
  h3: '1.64em',
};

export const fontWeights = {
  body: '400',
  links: '500',
  heading: '600',
};

export const lineHeights = {
  body: '1.5',
  heading: '1.1',
  code: '1.2',
};

export const shadows = {
  header: 'rgba(0, 0, 0, 0.09) 0px 2px 10px -3px',
  input: 'rgba(0, 0, 0, 0.09) 0px 2px 10px -3px',
};

export const mediaSizes = {
  sm: 700,
  md: 960,
  lg: 1200,
};

export const media = {
  sm: `(min-width: ${mediaSizes.sm}px)`,
  md: `(min-width: ${mediaSizes.md}px)`,
  lg: `(min-width: ${mediaSizes.lg}px)`,
};

export const spacing = {
  xs: '0.6rem',
  sm: '1.5rem',
  md: '2.75rem',
  lg: '4.75rem',
  xl: '8.2rem',
};
