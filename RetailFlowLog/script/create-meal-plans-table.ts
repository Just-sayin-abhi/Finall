import { config } from "dotenv";
config({ path: ".env" });

import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

await client.query(`DROP TABLE IF EXISTS meal_plans`);

await client.query(`
  CREATE TABLE meal_plans (
    id           VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      VARCHAR NOT NULL REFERENCES users(id),
    goal         VARCHAR(40) NOT NULL DEFAULT 'balanced',
    plan_data    JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW()
  )
`);

await client.query(`
  CREATE INDEX meal_plans_user_goal_idx ON meal_plans (user_id, goal)
`);

console.log("meal_plans table ready.");
await client.end();
