import { buildClientSchema } from 'graphql';
import { mocked } from 'ts-jest/utils';
import * as SchemaPredicates from './schemaPredicates';

describe('SchemaPredicates', () => {
  // eslint-disable-next-line
  const schema = buildClientSchema(require('../test-utils/simple_schema.json'));

  it('should match fragments by interface/union', () => {
    expect(
      SchemaPredicates.isInterfaceOfType(schema, 'ITodo', 'BigTodo')
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, 'ITodo', 'SmallTodo')
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, 'Search', 'BigTodo')
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, 'Search', 'SmallTodo')
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, 'ITodo', 'Todo')
    ).toBeFalsy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, 'Search', 'Todo')
    ).toBeFalsy();
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
      SchemaPredicates.isInterfaceOfType(schema, 'LatestTodoResult', 'Todo')
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(
        schema,
        'LatestTodoResult',
        'NoTodosError'
      )
    ).toBeTruthy();
    expect(
      SchemaPredicates.isInterfaceOfType(schema, 'Todo', 'NoTodosError')
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
