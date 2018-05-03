import Observable from 'zen-observable-ts';
import { IExchange } from '../../interfaces/exchange';
import { dedupExchange } from '../../modules/dedup-exchange';

describe('dedupExchange', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('forwards operations and subscribes', done => {
    let mockOp;

    const mockExchange = (operation =>
      new Observable(observer => {
        mockOp = operation;
        observer.next(operation);
        observer.complete();
      }) as any) as IExchange;

    const testExchange = dedupExchange(mockExchange);
    const testOperation = { key: 'test' } as any;

    testExchange(testOperation).subscribe({
      complete: done,
      next: op => {
        expect(op).toBe(testOperation);
        expect(mockOp).toBe(testOperation);
      },
    });
  });

  it('returns the same intermediate observable when called with same operation', () => {
    const mockExchange = jest.fn() as IExchange;
    const testExchange = dedupExchange(mockExchange);

    const obsA = testExchange({ key: 'a' } as any);
    expect(mockExchange).toHaveBeenLastCalledWith({ key: 'a' });
    const obsB = testExchange({ key: 'a' } as any);
    const obsC = testExchange({ key: 'b' } as any);
    expect(mockExchange).toHaveBeenLastCalledWith({ key: 'b' });
    expect(obsA).toBe(obsB);
    expect(obsA).not.toBe(obsC);
    expect(mockExchange).toHaveBeenCalledTimes(2);
  });

  it('deletes intermediate observable when in-flight operation completed', done => {
    const mockExchange = (() =>
      new Observable(observer => {
        observer.next(null);
        observer.complete();
      }) as any) as IExchange;

    const testExchange = dedupExchange(mockExchange);
    const obsA = testExchange({ key: 'a' } as any);

    obsA.subscribe({
      complete: () => {
        const obsB = testExchange({ key: 'a' } as any);
        expect(obsA).not.toBe(obsB);
        done();
      },
    });
  });

  it('invokes unsubscribe when all subscribers on the intermediate observable unsubscribed', () => {
    const mockUnsubscription = jest.fn();
    const testExchange = dedupExchange(
      () => new Observable(() => mockUnsubscription)
    );
    const obs = testExchange({ key: 'a' } as any);

    const sub = obs.subscribe({});
    obs.subscribe({}).unsubscribe();
    expect(mockUnsubscription).toHaveBeenCalledTimes(0);
    sub.unsubscribe();
    expect(mockUnsubscription).toHaveBeenCalledTimes(1);
  });
});
