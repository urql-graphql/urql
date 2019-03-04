import { SelectionNode } from 'graphql';
import { Scalar } from '../types';

export interface VarsMap {
  [name: string]: Scalar | VarsMap | Array<Scalar | VarsMap>;
}

export type SelectionSet = ReadonlyArray<SelectionNode>;

export interface FragmentSelectionSets {
  [fragmentName: string]: void | SelectionSet;
}
