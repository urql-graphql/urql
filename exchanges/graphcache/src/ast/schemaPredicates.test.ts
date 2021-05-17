import { Kind, InlineFragmentNode } from 'graphql';
import { buildClientSchema } from './schema';
import * as SchemaPredicates from './schemaPredicates';
import { minifyIntrospectionQuery } from '@urql/introspection';

const mocked = (x: any): any => x;

describe('SchemaPredicates', () => {
  // eslint-disable-next-line
  const schema = buildClientSchema(minifyIntrospectionQuery(require('../test-utils/simple_schema.json')));

  const frag = (value: string): InlineFragmentNode => ({
    kind: Kind.INLINE_FRAGMENT,
    typeCondition: {
      kind: Kind.NAMED_TYPE,
      name: {
        kind: Kind.NAME,
        value,
      },
    },
    selectionSet: {
      kind: Kind.SELECTION_SET,
      selections: [],
    },
  });

  it('should match fragments by interface/union', () => {
    expect(
      SchemaPredicates.isInterfaceOfType(schema, frag('ITodo'), 'BigTodo')
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, frag('ITodo'), 'SmallTodo')
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, frag('Search'), 'BigTodo')
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, frag('Search'), 'SmallTodo')
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, frag('ITodo'), 'Todo')
    ).toBeFalsy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, frag('Search'), 'Todo')
    ).toBeFalsy();

    const typeConditionLess = frag('Type');
    (typeConditionLess as any).typeCondition = undefined;
    expect(
      SchemaPredicates.isInterfaceOfType(schema, typeConditionLess, 'Todo')
    ).toBeTruthy();
  });

  it('should indicate nullability', () => {
    expect(
      SchemaPredicates.isFieldNullable(schema, 'Todo', 'text')
    ).toBeFalsy();
    expect(
      SchemaPredicates.isFieldNullable(schema, 'Todo', 'complete')
    ).toBeTruthy();
    expect(
      SchemaPredicates.isFieldNullable(schema, 'Todo', 'author')
    ).toBeTruthy();
  });

  it('should handle unions of objects', () => {
    expect(
      SchemaPredicates.isInterfaceOfType(
        schema,
        frag('LatestTodoResult'),
        'Todo'
      )
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(
        schema,
        frag('LatestTodoResult'),
        'NoTodosError'
      )
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, frag('Todo'), 'NoTodosError')
    ).toBeFalsy();
  });

  it('should throw if a requested type does not exist', () => {
    expect(() =>
      SchemaPredicates.isFieldNullable(schema, 'SomeInvalidType', 'complete')
    ).toThrow(
      'The type `SomeInvalidType` is not an object in the defined schema, but the GraphQL document is traversing it.\nhttps://bit.ly/2XbVrpR#3'
    );
  });

  it('should warn in console if a requested field does not exist', () => {
    expect(
      SchemaPredicates.isFieldNullable(schema, 'Todo', 'goof')
    ).toBeFalsy();

    expect(console.warn).toBeCalledTimes(1);
    const warnMessage = mocked(console.warn).mock.calls[0][0];
    expect(warnMessage).toContain('The field `goof` does not exist on `Todo`');
    expect(warnMessage).toContain('https://bit.ly/2XbVrpR#4');
  });
});
