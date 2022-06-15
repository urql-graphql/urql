const globals: { crypto?: Crypto } = (typeof window !== 'undefined'
  ? window
  : typeof self !== 'undefined'
  ? self
  : null) as any;
const webCrypto = globals && globals.crypto;

const sha256Browser = (bytes: Uint8Array): Promise<Uint8Array> =>
  webCrypto!.subtle
    .digest({ name: 'SHA-256' }, bytes)
    .then(result => new Uint8Array(result));

let nodeCrypto: Promise<typeof import('crypto')> | void;
if (typeof window === 'undefined' && !webCrypto) {
  // Indirect eval'd require/import to guarantee no side-effects in module scope
  // (optimization for minifiers)
  try {
    nodeCrypto = Promise.resolve(
      new Function('require', 'return require("crypto")')(require)
    );
  } catch (_error) {
    try {
      nodeCrypto = new Function('return import("crypto")')();
    } catch (_error) {}
  }
}

export const hash = async (query: string): Promise<string> => {
  // Node.js support
  if (nodeCrypto) {
    return nodeCrypto.then(crypto =>
      crypto.createHash('sha256').update(query).digest('hex')
    );
  } else if (webCrypto) {
    const buf = new TextEncoder().encode(query);
    const out = await sha256Browser(buf);

    let hash = '';
    for (let i = 0, l = out.length; i < l; i++) {
      const hex = out[i].toString(16);
      hash += '00'.slice(0, Math.max(0, 2 - hex.length)) + hex;
    }

    return hash;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[@urql/exchange-persisted-fetch]: The Node Crypto and Web Crypto APIs are not available.\n' +
        'This is an unexpected error. Please report it by filing a GitHub Issue.'
    );
  }

  return Promise.resolve('');
};
