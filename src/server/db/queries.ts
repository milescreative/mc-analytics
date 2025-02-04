// src/db/queries.ts
import { Database } from 'bun:sqlite';
import type { NewEvent } from './types';

export class EventQueries {
  constructor(private db: Database) {}

  insert(event: NewEvent, session_id: string, userAgent?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO events (
        name, domain, url, session_id,
        referrer, user_agent, meta, props,
        country, region, city
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        NULL, NULL, NULL
      )
    `);

    stmt.run(
      event.n,
      event.d,
      event.u,
      session_id,
      event.r || null,
      userAgent || null,
      event.m || null,
      event.p || null
    );
  }

  getAll(domain: string): Event[] {
    const stmt = this.db.prepare(
      'SELECT * FROM events WHERE domain = ? ORDER BY timestamp DESC'
    );
    return stmt.all(domain) as Event[];
  }
}
