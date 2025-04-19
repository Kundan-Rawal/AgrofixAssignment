import pkg from 'pg';
import { config } from 'dotenv';
config(); // ✅ load .env right here

const { Pool } = pkg;


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;