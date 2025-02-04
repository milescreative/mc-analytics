import { type Event } from './gen/types';

// How we store it in the database
export type StoredEvent = Event;

// For inserting new events (id and timestamp are handled by SQLite)
export type NewEvent = Omit<StoredEvent, 'id' | 'timestamp'>;
