class FetchMock {
  fetchCache?: any;
  constructor() {
    this.fetchCache = null;
  }
  mockResponse(data) {
    this.fetchCache = global.fetch;
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
    this.fetchCache = global.fetch;
    global.fetch = () =>
      new Promise(() => {
        throw new Error(e);
      });
  }
  restore() {
    global.fetch = this.fetchCache;
  }
}

export default new FetchMock();
