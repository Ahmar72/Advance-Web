const postgres = require('postgres');

const regions = [
  'us-east-1', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2',
  'sa-east-1', 'ca-central-1'
];

const projectId = 'ltfompgnjxoimoewduky';
const password = '@Ahmer@123';

async function testRegions() {
  console.log('Testing regions...');
  for (const region of regions) {
    const poolerUrl = `postgresql://postgres.${projectId}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    console.log(`Testing ${region}...`);
    
    try {
      const sql = postgres(poolerUrl, { connect_timeout: 3, idle_timeout: 1, max: 1 });
      await sql`SELECT 1`;
      console.log(`✅ Success in region: ${region}`);
      console.log(`Pooler URL: ${poolerUrl}`);
      process.exit(0);
    } catch (e) {
      if (e.message && e.message.includes('password authentication failed')) {
          console.log(`✅ Region found (${region}), but wrong password.`);
          process.exit(0);
      }
      // Ignore timeouts and other connection errors
    }
  }
  console.log('❌ Could not connect to any region.');
  process.exit(1);
}

testRegions();
