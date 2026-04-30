const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgres://postgres:sailadmin@localhost:5432/postgres'
  });

  await client.connect();

  async function recreateDB(dbName) {
    console.log('Recreating', dbName);
    await client.query(`UPDATE pg_database SET datallowconn = 'false' WHERE datname = $1;`, [dbName]).catch(() => null);
    await client.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1;`, [dbName]).catch(() => null);
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await client.query(`CREATE DATABASE "${dbName}"`);
  }

  // await recreateDB('production_master');
  // await recreateDB('tenant_dev');
  await recreateDB('Test_Master');
  await recreateDB('Test_Tenant_db');

  await client.end();
  console.log('Done');
}

run().catch(console.error);
