// src/server/index.ts
import { Database } from 'bun:sqlite';
import { schema } from './db/schema';

const db = new Database('analytics.db');
db.run(schema);

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers for the browser script
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Event collection endpoint
    if (url.pathname === '/api/event' && req.method === 'POST') {
      try {
        const event = await req.json();

        // Basic validation
        if (!event.n || !event.d || !event.u) {
          return new Response('Invalid event data', { status: 400 });
        }

        // Store event
        db.run(
          `
          INSERT INTO events (
            name, domain, url, referrer, meta, props, revenue
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [
            event.n,
            event.d,
            event.u,
            event.r || null,
            event.m || null,
            event.p ? JSON.stringify(event.p) : null,
            event.$ || null,
          ]
        );

        return new Response('OK', { status: 202 });
      } catch (err) {
        console.error('Error processing event:', err);
        return new Response('Server error', { status: 500 });
      }
    }

    return new Response('Not found', { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
