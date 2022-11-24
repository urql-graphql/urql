/**
 * @vitest-environment node
 */
import { fromValue } from 'wonka';
import { vi, it, expect } from 'vitest';
import * as messengers from './utils/messaging';

const createNativeMessenger = vi.spyOn(messengers, 'createNativeMessenger');
const createBrowserMessenger = vi.spyOn(messengers, 'createBrowserMessenger');

it('returns forwarding exchange', () => {
  (global as any).window = undefined;
  const { devtoolsExchange } = require('./exchange'); // eslint-disable-line
  expect(createNativeMessenger).toBeCalledTimes(0);
  expect(createBrowserMessenger).toBeCalledTimes(0);

  const value = fromValue('Heloo');
  const forward = vi.fn();

  devtoolsExchange({ forward })(value);
  expect(forward).toBeCalledTimes(1);
  expect(forward).toBeCalledWith(value);
});
