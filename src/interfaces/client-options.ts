export interface IClientOptions {
  url: string;
  fetchOptions?: object | (() => object);
}
