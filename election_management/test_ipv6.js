const postgres = require('postgres');

const sql = postgres({
  host: '2406:da1a:314:7101:1ea6:9586:790e:340a',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@Ahmer@123',
  connect_timeout: 5
});

async function testConnection() {
  console.log(`Testing IPv6 object config...`);
  try {
    await sql`SELECT 1`;
    console.log(`✅ Success via IPv6!`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }
}

testConnection();
