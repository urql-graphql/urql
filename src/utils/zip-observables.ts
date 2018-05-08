import Observable from 'zen-observable-ts';

/* takes an array of observables all emitting one value each,
 * and zips all results into one result observable */
export const zipObservables = <T>(obs: Array<Observable<T>>): Observable<T[]> =>
  new Observable<T[]>(observer => {
    const size = obs.length;
    const res: T[] = new Array(size);
    let complete = false;
    let received = 0;
    let subs = [];

    // unsubscription function iterating over each subscription
    const unsubscribe = () => {
      complete = true;
      subs.forEach(sub => sub.unsubscribe());
    };

    // Subscribe to each observable and map to subscriptions
    subs = obs.map((o, i) => {
      return o.subscribe({
        error: error => {
          observer.error(error);
          unsubscribe();
        },
        next: value => {
          // limit to a single emitted value
          if (res[i] === undefined) {
            // set value on result array
            res[i] = value;

            // If all values have been received and the observer hasn't unsubscribed
            if (++received === size && !complete) {
              // Emit zipped result and complete
              observer.next(res);
              observer.complete();
              complete = true;
            }
          }
        },
      });
    });

    return unsubscribe;
  });
