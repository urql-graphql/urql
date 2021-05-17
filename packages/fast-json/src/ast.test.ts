import { parse } from 'graphql';
import { getIntrospectedSchema } from '@urql/introspection';

import { buildClientSchema } from './schema';
import { collectDocumentFields } from './ast';

describe('collectDocumentFields', () => {
  it('collects fields from simple queries', () => {
    const types = buildClientSchema(
      getIntrospectedSchema(`
      type Friend {
        id: ID
        name: String
      }

      type Query {
        friend: Friend!
      }
    `)
    );

    const query = parse(`
      {
        friend {
          id
        }
        friend {
          ... on Friend {
            name
          }
          id
        }
      }
    `);

    const result = collectDocumentFields(types, query) as any;
    expect(result).toHaveProperty('selection.Query.friend.selection.Friend');
    expect(
      Object.keys(result.selection.Query.friend.selection.Friend)
    ).toEqual(['id', 'name']);
  });

  it('collects fields from queries with fields returning interfaces', () => {
    const types = buildClientSchema(
      getIntrospectedSchema(`
      interface Person {
        id: ID
        name: String
      }

      type Friend implements Person {
        id: ID
        name: String
        age: Int
      }

      type Query {
        person: Person!
      }
    `)
    );

    const query = parse(`
      {
        person {
          id
          name
          ... on Friend {
            age
          }
        }
      }
    `);

    const result = collectDocumentFields(types, query) as any;
    expect(result).toHaveProperty('selection.Query.person.selection.Friend');
    expect(result).toHaveProperty('selection.Query.person.selection.Person');

    expect(
      Object.keys(result.selection.Query.person.selection.Friend)
    ).toEqual(['id', 'name', 'age']);

    expect(
      Object.keys(result.selection.Query.person.selection.Person)
    ).toEqual(['id', 'name']);
  });

  it('collects fields from queries with fields with fragments for interfaces', () => {
    const types = buildClientSchema(
      getIntrospectedSchema(`
      interface Person {
        id: ID
        name: String
      }

      type Friend implements Person {
        id: ID
        name: String
        age: Int
      }

      type Query {
        friend: Friend!
      }
    `)
    );

    const query = parse(`
      {
        friend {
          ... on Person {
            id
            name
          }
          age
        }
      }
    `);

    const result = collectDocumentFields(types, query) as any;
    expect(result).toHaveProperty('selection.Query.friend.selection.Friend');
    expect(result).not.toHaveProperty(
      'selection.Query.friend.selection.Person'
    );

    expect(
      Object.keys(result.selection.Query.friend.selection.Friend)
    ).toEqual(['id', 'name', 'age']);
  });

  it('collects fields on interfaces with unrelated interfaces on a fragment', () => {
    const types = buildClientSchema(
      getIntrospectedSchema(`
      interface Node {
        id: ID!
      }

      interface Person {
        name: String
      }

      type Friend implements Person & Node {
        id: ID!
        name: String
        age: Int
      }

      type Query {
        person: Person!
      }
    `)
    );

    const query = parse(`
      {
        person {
          ... on Node {
            id
          }
          name
          ... on Friend {
            age
          }
          ... on Node {
            id
          }
        }
      }
    `);

    const result = collectDocumentFields(types, query) as any;
    expect(result).toHaveProperty('selection.Query.person.selection.Node');
    expect(result).toHaveProperty('selection.Query.person.selection.Friend');
    expect(result).toHaveProperty('selection.Query.person.selection.Person');

    expect(Object.keys(result.selection.Query.person.selection.Node)).toEqual([
      'id',
    ]);

    expect(
      Object.keys(result.selection.Query.person.selection.Person)
    ).toEqual(['name']);

    expect(
      Object.keys(result.selection.Query.person.selection.Friend)
    ).toEqual(['id', 'name', 'age']);
  });

  it('collects fields on unions via fragments', () => {
    const types = buildClientSchema(
      getIntrospectedSchema(`
      type Friend {
        id: ID!
        nickname: String
      }

      type Foe {
        id: ID!
        name: String
      }

      union Person = Friend | Foe

      type Query {
        person: Person!
      }
    `)
    );

    const query = parse(`
      {
        person {
          __typename
          ... on Friend {
            id
            nickname
          }
          ... on Foe {
            id
            name
          }
        }
      }
    `);

    const result = collectDocumentFields(types, query) as any;
    expect(result).toHaveProperty('selection.Query.person.selection.Person');
    expect(result).toHaveProperty('selection.Query.person.selection.Friend');
    expect(result).toHaveProperty('selection.Query.person.selection.Foe');

    expect(
      Object.keys(result.selection.Query.person.selection.Person)
    ).toEqual(['__typename']);

    expect(
      Object.keys(result.selection.Query.person.selection.Friend)
    ).toEqual(['__typename', 'id', 'nickname']);

    expect(Object.keys(result.selection.Query.person.selection.Foe)).toEqual([
      '__typename',
      'id',
      'name',
    ]);
  });

  it('collects fields on unions of types implementing interfaces', () => {
    const types = buildClientSchema(
      getIntrospectedSchema(`
      interface Node {
        id: ID!
      }

      interface Age {
        age: Int
      }

      type Friend implements Node & Age {
        id: ID!
        age: Int
        nickname: String
      }

      type Foe implements Node {
        id: ID!
        name: String
      }

      union Person = Friend | Foe

      type Query {
        person: Person!
      }
    `)
    );

    const query = parse(`
      {
        person {
          ... on Node {
            __typename
            id
          }
          ... on Age {
            age
          }
          ... on Friend {
            id
            nickname
          }
          ... on Foe {
            id
            name
          }
        }
      }
    `);

    const result = collectDocumentFields(types, query) as any;

    expect(result).not.toHaveProperty('selection.Query.person.selection.Node');
    expect(result).toHaveProperty('selection.Query.person.selection.Person');
    expect(result).toHaveProperty('selection.Query.person.selection.Age');
    expect(result).toHaveProperty('selection.Query.person.selection.Friend');
    expect(result).toHaveProperty('selection.Query.person.selection.Foe');

    expect(
      Object.keys(result.selection.Query.person.selection.Person)
    ).toEqual(['__typename', 'id']);

    expect(
      Object.keys(result.selection.Query.person.selection.Friend)
    ).toEqual(['__typename', 'id', 'age', 'nickname']);

    expect(Object.keys(result.selection.Query.person.selection.Foe)).toEqual([
      '__typename',
      'id',
      'name',
    ]);
  });
});
