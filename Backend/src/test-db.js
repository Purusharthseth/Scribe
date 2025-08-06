// test-db.js (ESM-friendly)
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import 'dotenv/config';
import { folders } from './db/schema.js';

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const db = drizzle(client);

// Fetch and log folders
const result = await db.select().from(folders);
console.log(result);

await client.end();
