// src/db/index.ts
import { Database } from 'bun:sqlite';
import { schema } from './schema';
import { type DatabaseConfig, defaultConfig } from './config';

export class DatabaseError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function initializeDatabase(
  config: DatabaseConfig = defaultConfig
): Database {
  try {
    const db = new Database(config.path);

    // Set pragmas for performance and safety
    db.exec('PRAGMA journal_mode=WAL;');
    db.exec('PRAGMA synchronous=NORMAL;');
    db.exec('PRAGMA foreign_keys=ON;');

    // Initialize schema
    db.exec(schema);

    return db;
  } catch (error) {
    throw new DatabaseError('Failed to initialize database', error);
  }
}

initializeDatabase();
