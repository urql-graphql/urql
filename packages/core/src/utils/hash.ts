export type HashValue = number & { readonly _opaque: unique symbol };

// When we have separate strings it's useful to run a progressive
// version of djb2 where we pretend that we're still looping over
// the same string
export const phash = (x: string, seed?: HashValue): HashValue => {
  let h = typeof seed === 'number' ? seed | 0 : 5381;
  for (let i = 0, l = x.length | 0; i < l; i++)
    h = (h << 5) + h + x.charCodeAt(i);
  return h as HashValue;
};
