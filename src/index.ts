export { Connect, ConnectHOC, Provider } from './components';
export { useQuery as unstable_useQuery } from './lib/hook-query';
export { useMutation as unstable_useMutation } from './lib/hook-mutation';
export {
  CombinedError,
  createQuery,
  createMutation,
  createClient,
} from './lib';
export { cacheExchange, dedupeExchange, fetchExchange } from './exchanges';
export * from './types';
