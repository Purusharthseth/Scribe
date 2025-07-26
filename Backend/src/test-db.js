import { db } from './db/drizzle.js';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    const result = await db.execute(sql`SELECT NOW()`);
    console.log("✅ Drizzle is working! DB time:", result.rows[0].now);
  } catch (error) {
    console.error("❌ Drizzle failed:", error.message);
  }
}

testConnection();