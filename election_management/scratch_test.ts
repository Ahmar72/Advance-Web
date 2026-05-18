import { db } from './src/db';
import { profiles } from './src/db/schema';

async function testConnection() {
  try {
    console.log('Testing connection...');
    const result = await db.select().from(profiles).limit(1);
    console.log('Connection successful!', result);
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
}

testConnection();
