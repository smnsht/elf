import {
  coerceArray,
  propsFactory,
  Query,
  Reducer,
  select,
  StateOf,
  Store,
  StoreDef,
} from '@ngneat/elf';

import { EMPTY, Observable, OperatorFunction } from 'rxjs';

type CacheValue = Record<string | number, CacheState>;
export type CacheState = {
  value: 'none' | 'partial' | 'full';
};

export const {
  withRequestsCache,
  updateRequestsCache,
  selectRequestsCache,
  resetRequestsCache,
  getRequestsCache,
  setRequestsCache,
} = propsFactory('requestsCache', {
  initialValue: {} as CacheValue,
});

export function selectRequestCache<S extends StateOf<typeof withRequestsCache>>(
  key: string | number
): OperatorFunction<S, CacheState> {
  return select((state) => getRequestCache(key)(state));
}

export function updateRequestCache<S extends StateOf<typeof withRequestsCache>>(
  key: string | number,
  value: CacheState['value']
): Reducer<S> {
  return updateRequestsCache({
    [key]: {
      value,
    },
  });
}

export function getRequestCache<S extends StateOf<typeof withRequestsCache>>(
  key: string | number
): Query<S, CacheState> {
  return function (state: S) {
    return (
      getRequestsCache(state)[key] ??
      ({
        value: 'none',
      } as CacheState)
    );
  };
}

export function selectIsRequestCached<
  S extends StateOf<typeof withRequestsCache>
>(
  key: Parameters<typeof isRequestCached>[0],
  options?: { value?: CacheState['value'] }
): OperatorFunction<S, boolean> {
  return select((state) => isRequestCached(key, options)(state));
}

export function isRequestCached<S extends StateOf<typeof withRequestsCache>>(
  key: string | number | string[] | number[],
  options?: { value?: CacheState['value'] }
) {
  return function (state: S) {
    const type = options?.value ?? 'full';
    return coerceArray(key).some(
      (k) => getRequestCache(k)(state).value === type
    );
  };
}

export function skipWhileCached<T, S extends StateOf<typeof withRequestsCache>>(
  store: Store<StoreDef<S>>,
  key: Parameters<typeof isRequestCached>[0],
  options?: { value?: CacheState['value']; returnSource?: Observable<any> }
) {
  return function (source: Observable<T>) {
    if (store.query(isRequestCached(key, { value: options?.value }))) {
      return options?.returnSource ?? EMPTY;
    }

    return source;
  };
}