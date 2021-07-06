const jsCrypto =
  typeof window !== 'undefined'
    ? window.crypto || (window as any).msCrypto
    : undefined;
const cryptoSubtle =
  jsCrypto && (jsCrypto.subtle || (jsCrypto as any).webkitSubtle);
const isIE = !!(jsCrypto && (window as any).msCrypto);

const sha256Browser = (bytes: Uint8Array): Promise<Uint8Array> => {
  const hash = cryptoSubtle!.digest({ name: 'SHA-256' }, bytes);
  return new Promise((resolve, reject) => {
    if (isIE) {
      // IE11
      (hash as any).oncomplete = function onComplete(event: any) {
        resolve(new Uint8Array(event.target.result));
      };
      (hash as any).onerror = function onError(error: Error) {
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
};

let nodeCrypto;
if (typeof window === 'undefined') {
  try {
    // Indirect eval/require to guarantee no side-effects in module scope
    // (optimization for minifiers)
    nodeCrypto = new Function('require', 'return require("crypto")')(require);
  } catch (e) {}
}

export const hash = async (query: string): Promise<string> => {
  if (
    typeof window === 'undefined'
      ? !nodeCrypto || !nodeCrypto.createHash
      : !cryptoSubtle
  ) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[@urql/exchange-persisted-fetch]: The ' +
          (typeof window === 'undefined'
            ? 'Node Crypto'
            : 'window.crypto.subtle') +
          ' API is not available.\n' +
          'This is an unexpected error. Please report it by filing a GitHub Issue.'
      );
    }

    return Promise.resolve('');
  }

  // Node.js support
  if (typeof window === 'undefined') {
    return Promise.resolve(
      '' + nodeCrypto.createHash('sha256').update(query).digest('hex')
    );
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

  const out = await sha256Browser(buf);

  let hash = '';
  for (let i = 0, l = out.length; i < l; i++) {
    const hex = out[i].toString(16);
    hash += '00'.slice(0, Math.max(0, 2 - hex.length)) + hex;
  }

  return hash;
};
