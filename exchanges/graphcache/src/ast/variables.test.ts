import { gql } from '@urql/core';
import { getMainOperation } from './traversal';
import { normalizeVariables, filterVariables } from './variables';

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

  it('preserves missing variables', () => {
    const operation = getMainOperation(
      gql`
        query {
          field
        }
      `
    );
    (operation as any).variableDefinitions = undefined;
    const normalized = normalizeVariables(operation, { test: true });
    expect(normalized).toEqual({ test: true });
  });
});

describe('filterVariables', () => {
  it('returns undefined when no variables are defined', () => {
    const operation = getMainOperation(
      gql`
        query {
          field
        }
      `
    );
    const vars = filterVariables(operation, { test: true });
    expect(vars).toBe(undefined);
  });

  it('filters out missing vars', () => {
    const input = { x: true, y: false };
    const operation = getMainOperation(
      gql`
        query($x: Int!) {
          field
        }
      `
    );
    const vars = filterVariables(operation, input);
    expect(vars).toEqual({ x: true });
  });

  it('ignores defaults', () => {
    const input = { x: undefined };
    const operation = getMainOperation(
      gql`
        query($x: Int! = 42) {
          field
        }
      `
    );
    const vars = filterVariables(operation, input);
    expect(vars).toEqual({ x: undefined });
  });
});
