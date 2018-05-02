export interface ILocation {
  line: number;
  column: number;
}

export interface IGraphQLError {
  message?: string;
  locations: ILocation[];
  path: string[];
}

export interface IResponse {
  data?: any;
  errors?: Array<string | IGraphQLError>;
}

export interface IProcessedResponse {
  typeNames: string[];
  data?: any;
  errors?: Array<string | IGraphQLError>;
}
