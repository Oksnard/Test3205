import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  URL_CHECKER_OPTIONS,
  type DelayFn,
  type FetchFn,
  type UrlCheckerOptions,
} from './url-checker.options';

export type { DelayFn, FetchFn } from './url-checker.options';

export interface HeadCheckOutcome {
  httpStatus: number | null;
  errorMessage: string | null;
}

export const defaultDelayFn: DelayFn = (ms, signal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });

@Injectable()
export class UrlCheckerService {
  private readonly fetchFn: FetchFn;
  private readonly delayFn: DelayFn;

  constructor(
    @Optional() @Inject(URL_CHECKER_OPTIONS) options?: UrlCheckerOptions,
  ) {
    this.fetchFn = options?.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.delayFn = options?.delayFn ?? defaultDelayFn;
  }

  async checkUrl(url: string, signal: AbortSignal): Promise<HeadCheckOutcome> {
    const delayMs = Math.floor(Math.random() * 10_001);

    try {
      await this.delayFn(delayMs, signal);

      const response = await this.fetchFn(url, {
        method: 'HEAD',
        signal,
        redirect: 'follow',
      });

      return {
        httpStatus: response.status,
        errorMessage: null,
      };
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'HEAD request failed';

      return {
        httpStatus: null,
        errorMessage: message,
      };
    }
  }
}
