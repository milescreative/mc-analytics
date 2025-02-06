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

// src/client/types.ts
export type CoreEventName =
  | 'pageview' // Base page load
  | 'pageleave' // User leaves page
  | 'engagement' // Scroll/interaction
  | 'click' // Button/link clicks
  | 'file' // File downloads
  | 'custom'; // Any custom event

// Additional metadata for specific events
export type EventMetadata = {
  // Engagement
  scrollDepth?: number;
  timeOnPage?: number;

  // Click
  elementId?: string;
  elementClass?: string;
  text?: string;
  href?: string;

  // File
  fileName?: string;
  fileType?: string;
  fileSize?: number;

  // Custom
  [key: string]: unknown;
};
