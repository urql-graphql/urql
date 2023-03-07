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

module.exports = { schema };
