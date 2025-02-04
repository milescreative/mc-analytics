// src/db/config.ts
export type DatabaseConfig = {
  path: string;
  maxConnections?: number;
  timeout?: number;
};

export const defaultConfig: DatabaseConfig = {
  path: process.env.DB_PATH || 'analytics.db',
  maxConnections: 10,
  timeout: 5000,
};
