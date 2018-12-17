export { default as Client } from './modules/client';
export * from './modules/client';

export { default as Provider } from './components/provider';
export * from './components/provider';

export { default as Connect } from './components/connect';
export * from './components/connect';

export { default as ConnectHOC } from './components/connect-hoc';
export * from './components/connect-hoc';

export { useQuery as unstable_useQuery } from './modules/react-hooks/query';
export {
  useMutation as unstable_useMutation,
} from './modules/react-hooks/mutation';

export * from './modules/query';
export * from './modules/cache-exchange';
export * from './modules/dedup-exchange';
export * from './modules/error';
export * from './modules/http-exchange';
export * from './modules/subscription-exchange';

export * from './interfaces/index';
