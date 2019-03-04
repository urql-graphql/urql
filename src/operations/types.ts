import { DocumentNode, OperationDefinitionNode } from 'graphql';
import { FragmentSelectionSets, VarsMap } from '../ast';
import { Store } from '../store';
import { Scalar, SystemFields } from '../types';

export interface DataFields {
  [fieldName: string]: Data | Data[] | Scalar;
}

export type Data = DataFields & SystemFields;

export interface Request {
  query: DocumentNode;
  variables?: null | object;
}

export interface Result {
  data?: null | Data;
  isComplete: boolean;
  dependencies: string[];
}

export interface Context {
  /** List of heuristic keys indicating what paths have been walked */
  dependencies: string[];
  /** When reading from cache it indicates whether the result is likely complete */
  isComplete: boolean;
  operation: OperationDefinitionNode;
  store: Store;
  fragments: FragmentSelectionSets;
  vars: VarsMap;
}
