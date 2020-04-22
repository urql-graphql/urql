import { sha256 as sha256Standard } from 'js-sha256';

const jsCrypto = typeof window !== 'undefined'
  ? (window.crypto || (window as any).msCrypto)
  : undefined;
const cryptoSubtle = jsCrypto
  && (jsCrypto.subtle || (jsCrypto as any).webkitSubtle);

const sha256 = (bytes: Uint8Array): Promise<Uint8Array> => {
  if (!cryptoSubtle) {
    return Promise.resolve(new Uint8Array(0));
  }

  const hash = cryptoSubtle.digest({ name: 'SHA-256' }, bytes);
  return new Promise((resolve, reject) => {
    if ((hash as any).oncomplete) {
      // IE11
      (hash as any).oncomplete = function onComplete(event) {
        resolve(new Uint8Array(event.target.result));
      };
      (hash as any).onerror = function onError(error) {
        reject(error);
      };
    } else {
      // Standard promise-based
      Promise.resolve(hash)
        .then(function (result) {
          resolve(new Uint8Array(result));
        })
        .catch(function (error) {
          reject(error);
        });
    }
  });
}

export const hash = async (query: string): Promise<string> => {
  // Node.js support
  if (typeof window === 'undefined') {
    return Promise.resolve(sha256Standard(query));
  }

  let buf: Uint8Array;
  if (typeof TextEncoder !== 'undefined') {
    buf = new TextEncoder().encode(query);
  } else {
    buf = new Uint8Array(query.length);
    for (let i = 0, l = query.length; i < l; i++) {
      // NOTE: We assume that the input GraphQL Query only uses UTF-8 at most
      // since GraphQL mostly consists of ASCII, this is completely fine
      buf[i] = query.charCodeAt(i);
    }
  }

  const out = await sha256(buf);

  let hash = '';
  for (let i = 0, l = out.length; i < l; i++) {
    const hex = out[i].toString(16);
    hash += '00'.slice(0, Math.max(0, 2 - hex.length)) + hex;
  }

  return hash;
};
