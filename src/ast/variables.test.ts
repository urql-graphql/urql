import gql from 'graphql-tag';
import { getMainOperation } from './traversal';
import { normalizeVariables } from './variables';

describe('normalizeVariables', () => {
  it('normalizes variables', () => {
    const input = { x: 42 };
    const operation = getMainOperation(
      gql`
        query($x: Int!) {
          field
        }
      `
    );
    const normalized = normalizeVariables(operation, input);
    expect(normalized).toEqual({ x: 42 });
  });

  it('normalizes variables with defaults', () => {
    const input = { x: undefined };
    const operation = getMainOperation(
      gql`
        query($x: Int! = 42) {
          field
        }
      `
    );
    const normalized = normalizeVariables(operation, input);
    expect(normalized).toEqual({ x: 42 });
  });

  it('normalizes variables even with missing fields', () => {
    const input = { x: undefined };
    const operation = getMainOperation(
      gql`
        query($x: Int!) {
          field
        }
      `
    );
    const normalized = normalizeVariables(operation, input);
    expect(normalized).toEqual({});
  });

  it('skips normalizing for queries without variables', () => {
    const operation = getMainOperation(
      gql`
        query {
          field
        }
      `
    );
    (operation as any).variableDefinitions = undefined;
    const normalized = normalizeVariables(operation, {});
    expect(normalized).toEqual({});
  });
});
