// src/client/types.ts
export type EventOptions = {
  callback?: (response: { status: number }) => void;
  meta?: Record<string, unknown>;
  props?: Record<string, unknown>;
  u?: string;
};

export type EventPayload = {
  name: string;
  domain: string;
  url: string;
  referrer?: string | null;
  meta?: string;
  props?: string;
};
