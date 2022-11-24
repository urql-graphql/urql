export const getDisplayName = () => {
  const defaultLimit = Error.stackTraceLimit;
  Error.stackTraceLimit = Infinity;

  const trace = new Error().stack || '';

  // Default stack trace limit
  Error.stackTraceLimit = defaultLimit;

  // Get name of function that called 'useQuery'
  const findings = /(useQuery|useMutation|useSubscription).*\n\s*at (\w+)/.exec(
    trace
  );

  if (findings === null) {
    return 'Unknown';
  }

  return findings[2];
};
