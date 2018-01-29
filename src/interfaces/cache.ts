export interface ICache {
  write: (query: string, data: any) => Promise<any>;
  read: (query: string) => Promise<any>;
  invalidate: (query: string) => Promise<any>;
  invalidateAll: () => Promise<any>;
  update: (callback: (...args: any[]) => void) => Promise<any>;
}
