// src/db/schema.ts
import { Database } from 'bun:sqlite';
import { schema as genSchema } from './gen/schema';

export const schema = genSchema;

export function initDb(path: string = 'analytics.db'): Database {
  const db = new Database(path);
  db.exec(schema);
  return db;
}
