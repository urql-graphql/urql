const webCrypto = (typeof window !== 'undefined'
  ? window.crypto
  : typeof self !== 'undefined'
  ? self.crypto
  : null) as typeof globalThis.crypto | null;

let nodeCrypto: Promise<typeof import('crypto') | void> | void;

const getNodeCrypto = async (): Promise<typeof import('crypto') | void> => {
  if (!nodeCrypto) {
    // Indirect eval'd require/import to guarantee no side-effects in module scope
    // (optimization for minifiers)
    try {
      nodeCrypto = new Function('require', 'return require("crypto")')(require);
    } catch (_error) {
      try {
        nodeCrypto = new Function('return import("crypto")')();
      } catch (_error) {}
    }
  }
  return nodeCrypto;
};

export const hash = async (query: string): Promise<string> => {
  if (webCrypto) {
    const digest = await webCrypto.subtle.digest(
      { name: 'SHA-256' },
      new TextEncoder().encode(query)
    );
    return new Uint8Array(digest).reduce(
      (prev, byte) => prev + byte.toString(16).padStart(2, '0'),
      ''
    );
  } else if (await getNodeCrypto()) {
    // Node.js support
    return (await nodeCrypto)!.createHash('sha256').update(query).digest('hex');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[@urql/exchange-persisted-fetch]: The Node Crypto and Web Crypto APIs are not available.\n' +
        'This is an unexpected error. Please report it by filing a GitHub Issue.'
    );
  }

  return '';
};
