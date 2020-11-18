import { createClient } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { executeExchange } from '@urql/exchange-execute';
import { buildSchema } from 'graphql';

const client = createClient({
    url: "http://localhost:3000/graphql",
    exchanges: [
        cacheExchange({}),
        executeExchange({})
    ]
});

export default client;