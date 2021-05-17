const { gql } = require('@urql/core');
const { getIntrospectedSchema } = require('@urql/introspection');
const { makeParser } = require('../dist/urql-fast-json.min');

const makeEntries = (amount, makeEntry) => {
  const entries = [];
  for (let i = 0; i < amount; i++) entries.push(makeEntry(i));
  return entries;
};

suite('1,000 entries parse', () => {
  const schema = getIntrospectedSchema(`
    type Author {
      id: ID!
      name: String
    }

    type Todo {
      id: ID!
      text: String
      complete: Boolean
      due: String
      author: Author!
    }

    type Query {
      todos: [Todo]
    }
  `);

  const makeTodo = i => ({
    __typename: 'Todo',
    id: `${i}`,
    text: `Todo ${i}`,
    complete: Boolean(i % 2),
    due: new Date(+new Date() - Math.floor(Math.random() * 10000000000)),
    author: {
      __typename: 'Author',
      id: `Author ${i}`,
      name: `Tom ${i}. Hiddleston`
    },
  });

  const parse = makeParser(schema).forQuery(gql`
    query {
      todos {
        __typename
        id
        text
        complete
        due
        author {
          __typename
          id
          name
        }
      }
    }
  `);

  const json = JSON.stringify({
    todos: makeEntries(1000, makeTodo),
  });

  benchmark('JSON.parse', () => {
    return JSON.parse(json);
  });

  benchmark('@urql/fast-json', () => {
    return parse(json);
  });
});
