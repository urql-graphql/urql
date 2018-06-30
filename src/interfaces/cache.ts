export interface ICache {
  write: (key: string, data: any) => Promise<any>;
  read: (key: string) => Promise<any>;
  invalidate: (key: string) => Promise<any>;
  invalidateAll: () => Promise<any>;
  update: (callback: (...args: any[]) => void) => Promise<any>;
}
