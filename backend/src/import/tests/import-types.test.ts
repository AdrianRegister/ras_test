import { describe, expect, it } from 'vitest';
import type { ImportRowStatus } from '../../../src/import/import-types.js';

describe('ImportRowStatus', () => {
  it('documents all supported import outcomes', () => {
    const statuses: ImportRowStatus[] = [
      'READY',
      'PARTIALLY_VALID',
      'REVIEW_REQUIRED',
      'REJECTED',
      'DUPLICATE',
    ];

    expect(statuses).toHaveLength(5);
    expect(new Set(statuses).size).toBe(5);
  });
});
