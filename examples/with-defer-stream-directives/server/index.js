// Credits to https://github.com/maraisr/meros/blob/main/examples/relay-with-helix/server.js

/* eslint-disable @typescript-eslint/no-var-requires, es5/no-generators, no-console */
const polka = require('polka');
const { json } = require('@polka/parse');
const cors = require('cors')();
const { getGraphQLParameters, processRequest } = require('graphql-helix');
const {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} = require('graphql');

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      alphabet: {
        type: new GraphQLList(
          new GraphQLObjectType({
            name: 'Alphabet',
            fields: {
              char: {
                type: GraphQLString,
              },
            },
          })
        ),
        resolve: async function* () {
          for (let letter = 65; letter <= 90; letter++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            yield { char: String.fromCharCode(letter) };
          }
        },
      },
      song: {
        type: new GraphQLObjectType({
          name: 'Song',
          fields: () => ({
            firstVerse: {
              type: GraphQLString,
              resolve: () => "Now I know my ABC's.",
            },
            secondVerse: {
              type: GraphQLString,
              resolve: () =>
                new Promise(resolve =>
                  setTimeout(
                    () => resolve("Next time won't you sing with me?"),
                    5000
                  )
                ),
            },
          }),
        }),
        resolve: () =>
          new Promise(resolve => setTimeout(() => resolve('goodbye'), 1000)),
      },
    }),
  }),
});

polka()
  .use(cors, json())
  .use('/graphql', async (req, res) => {
    const request = {
      body: req.body,
      headers: req.headers,
      method: req.method,
      query: req.query,
    };

    let { operationName, query, variables } = getGraphQLParameters(request);

    const result = await processRequest({
      operationName,
      query,
      variables,
      request,
      schema,
    });

    if (result.type === 'RESPONSE') {
      result.headers.forEach(({ name, value }) => res.setHeader(name, value));
      res.writeHead(result.status, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify(result.payload));
    } else if (result.type === 'MULTIPART_RESPONSE') {
      res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'multipart/mixed; boundary="-"',
        'Transfer-Encoding': 'chunked',
      });

      req.on('close', () => {
        result.unsubscribe();
      });

      res.write('---');

      await result.subscribe(result => {
        const chunk = Buffer.from(JSON.stringify(result), 'utf8');
        const data = [
          '',
          'Content-Type: application/json; charset=utf-8',
          '',
          chunk,
        ];

        if (result.hasNext) {
          data.push('---');
        }

        res.write(data.join('\r\n'));
      });

      res.write('\r\n-----\r\n');
      res.end();
    }
  })
  .listen(3004, err => {
    if (err) throw err;
    console.log(`> Running on localhost:3004`);
  });
