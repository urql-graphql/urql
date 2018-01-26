export class FetchMock {
  fetchCache?: any;
  constructor() {
    this.fetchCache = null;
  }
  public mockResponse(data) {
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
  public mockError(e) {
    // @ts-ignore
    this.fetchCache = global.fetch;
    // @ts-ignore
    global.fetch = () =>
      new Promise(() => {
        throw new Error(e);
      });
  }
  public restore() {
    // @ts-ignore
    global.fetch = this.fetchCache;
  }
}

export default new FetchMock();
