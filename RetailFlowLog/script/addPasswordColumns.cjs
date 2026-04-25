const { Client } = require("pg");
require("dotenv/config");

async function main() {
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({ connectionString: cs });
  await client.connect();
  await client.query("BEGIN");

  try {
    await client.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider varchar(20) DEFAULT 'email'"
    );
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt varchar");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar");
    await client.query("COMMIT");
    console.log("Password auth columns are ready.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

