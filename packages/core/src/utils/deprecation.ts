/**
 * Module-scoped state to track if deprecation warnings have already been issued
 * for a particular key.
 */
let issuedWarnings: Record<string, boolean> = {};

/**
 * If a deprecation warning has not already been issued, use `console.warn()` to
 * issue it with an eye-catching prefix string.
 */
export const deprecationWarning = ({
  key,
  message,
}: {
  key: string;
  message: string;
}) => {
  if (!issuedWarnings[key]) {
    console.warn(`[WARNING: Deprecated] ${message}`);

    issuedWarnings[key] = true;
  }
};

/**
 * Clears all issued warnings - intended for use in testing.
 */
export const _clearWarnings = () => {
  issuedWarnings = {};
};
