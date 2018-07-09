export interface IGraphQLLocation {
  line: number;
  column: number;
}

export interface IGraphQLErrorInput {
  message: string;
  path?: Array<string | number>;
  locations?: IGraphQLLocation[];
  extensions?: { [key: string]: any };
}

export interface IGraphQLError extends Error {
  message: string;
  path?: Array<string | number>;
  locations?: IGraphQLLocation[];
  extensions?: { [key: string]: any };
}
