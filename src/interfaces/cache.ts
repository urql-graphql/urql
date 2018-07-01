export interface ICache {
  write: (key: string, data: any) => Promise<any>;
  read: (key: string) => Promise<any>;
  invalidate: (key: string) => Promise<any>;
  invalidateAll: () => Promise<any>;
  update: (
    callback: (store: any, key: string, value: any) => void
  ) => Promise<any>;
}
