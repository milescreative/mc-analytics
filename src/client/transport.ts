import type { EventPayload } from './types';

import type { EventOptions } from './types';

import { appendFile } from 'node:fs/promises';

// src/client/transport.ts
export async function sendEvent(
  endpoint: string,
  payload: EventPayload,
  options?: EventOptions
): Promise<void> {
  const logEntry =
    JSON.stringify({
      timestamp: new Date().toISOString(),
      endpoint,
      payload,
    }) + '\n';

  // For testing, log to both console and file
  console.log('Analytics Event:', {
    endpoint,
    payload,
  });

  try {
    await appendFile('analytics.log', logEntry);

    options?.callback?.({ status: 200 });
  } catch (error) {
    console.warn('Failed to log analytics event:', error);
    options?.callback?.({ status: 500 });
  }
}
