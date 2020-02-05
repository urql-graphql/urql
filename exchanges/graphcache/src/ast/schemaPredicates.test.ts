import { buildClientSchema } from 'graphql';
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
});
