const postgres = require('postgres');

const poolerUrl = `postgresql://postgres.ltfompgnjxoimoewduky:${encodeURIComponent('@Ahmer@123')}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`;

async function testConnection() {
  console.log(`Testing Transaction Pooler (port 6543)...`);
  try {
    const sql = postgres(poolerUrl, { connect_timeout: 5 });
    await sql`SELECT 1`;
    console.log(`✅ Success via Transaction Pooler!`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }
}

testConnection();
