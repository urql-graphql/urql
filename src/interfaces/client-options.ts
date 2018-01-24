export interface ClientOptions {
  url: string;
  fetchOptions?: object | (() => object);
}
