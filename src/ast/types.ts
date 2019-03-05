import { FragmentDefinitionNode, SelectionNode } from 'graphql';
import { Scalar } from '../types';

export type OperationType = 'Subscription' | 'Mutation' | 'Query';

export interface VarsMap {
  [name: string]: Scalar | VarsMap | Array<Scalar | VarsMap>;
}

export type SelectionSet = ReadonlyArray<SelectionNode>;

export interface Fragments {
  [fragmentName: string]: void | FragmentDefinitionNode;
}
