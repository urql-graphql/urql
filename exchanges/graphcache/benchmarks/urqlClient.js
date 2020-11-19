window.process = { env: { NODE_ENV: "development" } };

import { createClient } from 'urql/core';
import { cacheExchange } from '@urql/exchange-graphcache';
import { executeExchange } from '@urql/exchange-execute';

const client = createClient({
    url: "http://localhost:3000/graphql",
    exchanges: [
        cacheExchange({}),
        executeExchange({})
    ]
});

export default client;