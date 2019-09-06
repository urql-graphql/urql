const cache = {};

export const warning = (clause, msg) => {
  if (!clause && !cache[msg]) {
    console.warn(msg);
    cache[msg] = true;
  }
};
