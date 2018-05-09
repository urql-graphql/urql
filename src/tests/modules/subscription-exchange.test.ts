import { IOperation } from '../../interfaces/index';
import { subscriptionExchange } from '../../modules/subscription-exchange';
import { CombinedError } from '../../modules/error';

describe('subscriptionExchange', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('ignores non-subscription operations', () => {
    const forward = jest.fn() as any;
    const createSubscription = jest.fn() as any;
    const exchange = subscriptionExchange(createSubscription, forward);

    exchange(({
      operationName: 'query',
    } as any) as IOperation);

    expect(createSubscription).not.toHaveBeenCalled();
    expect(forward).toHaveBeenCalled();
  });

  it('creates a continuous exchange observable with a sub-observer', done => {
    const exOperation = ({
      key: 'test',
      operationName: 'subscription',
    } as any) as IOperation;

    const next = jest.fn();
    const error = jest.fn();
    const unsubscribe = jest.fn();

    const createSubscription = (operation, observer) => {
      expect(operation).toBe(exOperation);
      expect(observer.next).toBeTruthy();
      expect(observer.error).toBeTruthy();

      setTimeout(() => {
        const inputA = { data: 'test' };
        expect(next).not.toHaveBeenCalled();
        observer.next(inputA);

        // Inputs are passed through with their data
        expect(next).toHaveBeenLastCalledWith(inputA);

        const inputB = { errors: ['test error'] };
        observer.next(inputB);

        // Errors on data are "packaged up" in CombinedError
        expect(next).toHaveBeenLastCalledWith({
          data: undefined,
          error: new CombinedError({ graphQLErrors: ['test error'] }),
        });

        expect(error).not.toHaveBeenCalled();

        const inputErr = new Error('test');
        observer.error(inputErr);
        // Error emissions are "packaged up" as CombinedError
        expect(error).toHaveBeenCalledWith(
          new CombinedError({ networkError: inputErr })
        );

        done();
      });

      return { unsubscribe };
    };

    const exchange = subscriptionExchange(createSubscription, null);

    exchange(exOperation).subscribe({
      error,
      next,
    });
  });

  it('passes up the unsubscribe into the user’s returned subscription', () => {
    const exOperation = ({
      key: 'test',
      operationName: 'subscription',
    } as any) as IOperation;

    const unsubscribe = jest.fn();
    const createSubscription = () => ({ unsubscribe });
    const exchange = subscriptionExchange(createSubscription, null);

    exchange(exOperation)
      .subscribe(() => {
        throw new Error('Should not be called');
      })
      .unsubscribe();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
