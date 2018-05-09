import Observable from 'zen-observable-ts';
import { zipObservables } from '../../utils/zip-observables';

describe('zipObservables', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('combines the results of multiple observables', done => {
    zipObservables([Observable.of('a'), Observable.of('b')]).subscribe(res => {
      expect(res).toEqual(['a', 'b']);
      done();
    });
  });

  it('handles observables with multiple emissions gracefully', done => {
    zipObservables([
      Observable.from(['a', 'nope']),
      Observable.from(['b', 'also nope']),
    ]).subscribe(res => {
      expect(res).toEqual(['a', 'b']);
      done();
    });
  });

  it('errors with the first error it encounters', done => {
    zipObservables([
      Observable.of('a'),
      new Observable(observer => {
        setTimeout(() => observer.error(new Error('test')));
      }),
    ]).subscribe({
      error: err => {
        expect(err.message).toBe('test');
        done();
      },
      next: () => {
        throw new Error('Should not be called');
      },
    });
  });

  it('cancels all observables when the combined subscription is cancelled', () => {
    const unsub = jest.fn();
    const obs = new Observable(observer => {
      setTimeout(() => {
        observer.next('bla');
        observer.complete();
      });

      return unsub;
    });

    const sub = zipObservables([obs]).subscribe({
      error: () => {
        throw new Error('Should not be called');
      },
      next: () => {
        throw new Error('Should not be called');
      },
    });

    sub.unsubscribe();
    expect(unsub).toHaveBeenCalled();
  });
});
