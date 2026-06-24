import { describe, expect, it } from 'vitest';
import { parseUrls } from './parseUrls';

describe('parseUrls', () => {
  it('splits by newlines', () => {
    expect(parseUrls('https://a.com\nhttps://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('splits by commas', () => {
    expect(parseUrls('https://a.com, https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('splits by mixed separators', () => {
    expect(parseUrls('https://a.com, https://b.com\nhttps://c.com')).toEqual([
      'https://a.com',
      'https://b.com',
      'https://c.com',
    ]);
  });

  it('ignores empty parts', () => {
    expect(parseUrls('https://a.com,\n\n, https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });
});
