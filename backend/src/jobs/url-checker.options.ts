export const URL_CHECKER_OPTIONS = Symbol('URL_CHECKER_OPTIONS');

export type FetchFn = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export type DelayFn = (ms: number, signal: AbortSignal) => Promise<void>;

export interface UrlCheckerOptions {
  fetchFn?: FetchFn;
  delayFn?: DelayFn;
}
