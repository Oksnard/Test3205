import { UrlCheckerService } from '../src/jobs/url-checker.service';

describe('UrlCheckerService', () => {
  it('returns HTTP status on successful HEAD request', async () => {
    const service = new UrlCheckerService({
      fetchFn: async () => new Response(null, { status: 204 }),
      delayFn: async () => undefined,
    });

    const result = await service.checkUrl(
      'https://example.com',
      new AbortController().signal,
    );

    expect(result.httpStatus).toBe(204);
    expect(result.errorMessage).toBeNull();
  });

  it('returns error message when fetch fails', async () => {
    const service = new UrlCheckerService({
      fetchFn: async () => {
        throw new Error('network down');
      },
      delayFn: async () => undefined,
    });

    const result = await service.checkUrl(
      'https://example.com',
      new AbortController().signal,
    );

    expect(result.httpStatus).toBeNull();
    expect(result.errorMessage).toBe('network down');
  });

  it('aborts during artificial delay', async () => {
    const controller = new AbortController();
    const service = new UrlCheckerService({
      fetchFn: async () => new Response(null, { status: 200 }),
      delayFn: async (ms, signal) =>
        new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, ms);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    });

    const promise = service.checkUrl('https://example.com', controller.signal);
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
