export class FetchMock {
  fetchCache?: any;
  constructor() {
    this.fetchCache = null;
  }
  mockResponse(data) {
    // @ts-ignore
    this.fetchCache = global.fetch;
    // @ts-ignore
    global.fetch = () =>
      new Promise(resolve => {
        resolve({
          json: () =>
            new Promise(resolve => {
              resolve(data);
            }),
        });
      });
  }
  mockError(e) {
    // @ts-ignore
    this.fetchCache = global.fetch;
    // @ts-ignore
    global.fetch = () =>
      new Promise(() => {
        throw new Error(e);
      });
  }
  restore() {
    // @ts-ignore
    global.fetch = this.fetchCache;
  }
}

export default FetchMock;
