// Add proper types for test environments
declare global {
  interface Window {
    _phantom: unknown;
    __nightmare: unknown;
    Cypress: unknown;
    analytics: (name: string, options?: import('./types').EventOptions) => void;
  }
}

// This export is needed to make this a module
export {};
