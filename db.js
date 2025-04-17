import pkg from 'pg';
import { config } from 'dotenv';
config(); // ✅ load .env right here

const { Pool } = pkg;

console.log("DB URL:", process.env.DATABASE_URL); // Confirm it logs

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;