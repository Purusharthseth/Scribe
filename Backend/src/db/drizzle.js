import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://ScribeUser:CawffeeIsLove@localhost:5432/ScribeDB",
});

export const db = drizzle(pool);