import type { Accessor } from 'solid-js';

export type MaybeAccessor<T> = T | Accessor<T>;

export type MaybeAccessorValue<T extends MaybeAccessor<any>> =
  T extends () => any ? ReturnType<T> : T;

export const asAccessor = <A extends MaybeAccessor<unknown>>(
  v: A
): Accessor<MaybeAccessorValue<A>> =>
  typeof v === 'function' ? (v as any) : () => v;
