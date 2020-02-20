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
  passiveBg: '#f6f6f6',
  bg: '#ffffff',
  border: '#ececec',
  text: '#000000',
  heading: '#050617',
  accent: '#566ac8',
  code: '#403f53',
  passive: '#9999a6',
};

export const layout = {
  page: '144rem',
  header: '4.8rem',
  stripes: '0.9rem',
  sidebar: '28rem',
  legend: '22rem',
};

export const fonts = {
  heading: systemFonts.join(', '),
  body: systemFonts.join(', '),
  code: 'monospace',
};

export const fontSizes = {
  small: '0.9em',
  body: '1.8rem',
  code: '0.9em',
  h1: '3.45em',
  h2: '2.11em',
  h3: '1.64em',
};

export const fontWeights = {
  body: '400',
  heading: '600',
};

export const lineHeights = {
  body: '1.5',
  heading: '1.1',
  code: '1.2',
};

export const shadows = {
  input: 'rgba(0, 0, 0, 0.09) 0px 2px 10px -3px',
};

export const media = {
  sm: '(min-width: 650px)',
  md: '(min-width: 960px)',
  lg: '(min-width: 1200px)',
};

export const spacing = {
  xs: '0.6rem',
  sm: '1.5rem',
  md: '2.75rem',
  lg: '4.75rem',
  xl: '8.2rem',
};
