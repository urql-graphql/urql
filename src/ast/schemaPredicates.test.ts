import { SchemaPredicates } from './schemaPredicates';

describe('SchemaPredicates', () => {
  let schemaPredicates;

  beforeAll(() => {
    // eslint-disable-next-line
    const schema = require('../test-utils/simple_schema.json');
    schemaPredicates = new SchemaPredicates(schema);
  });

  it('should match fragments by interface/union', () => {
    expect(schemaPredicates.isInterfaceOfType('ITodo', 'BigTodo')).toBeTruthy();
    expect(
      schemaPredicates.isInterfaceOfType('ITodo', 'SmallTodo')
    ).toBeTruthy();
    expect(
      schemaPredicates.isInterfaceOfType('Search', 'BigTodo')
    ).toBeTruthy();
    expect(
      schemaPredicates.isInterfaceOfType('Search', 'SmallTodo')
    ).toBeTruthy();
    expect(schemaPredicates.isInterfaceOfType('ITodo', 'Todo')).toBeFalsy();
    expect(schemaPredicates.isInterfaceOfType('Search', 'Todo')).toBeFalsy();
  });

  it('should indicate nullability', () => {
    expect(schemaPredicates.isFieldNullable('Todo', 'text')).toBeFalsy();
    expect(schemaPredicates.isFieldNullable('Todo', 'complete')).toBeTruthy();
    expect(schemaPredicates.isFieldNullable('Todo', 'author')).toBeTruthy();
  });
});
