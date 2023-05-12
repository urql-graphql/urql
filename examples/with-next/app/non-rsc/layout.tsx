import {
  UrqlProvider,
  ssrExchange,
  cacheExchange,
  fetchExchange,
  createClient,
} from '@urql/next';

const ssr = ssrExchange();
const client = createClient({
  url: 'https://trygql.formidable.dev/graphql/web-collections',
  exchanges: [cacheExchange, ssr, fetchExchange],
});

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <UrqlProvider client={client} ssr={ssr}>
      {children}
    </UrqlProvider>
  );
}
