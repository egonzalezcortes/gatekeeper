import { Pool, PoolClient } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

// Export the pool for non-tenant queries (e.g., login by email).
export const pool = new Pool({ connectionString });

// Executes a function inside a transaction with tenant context set.
// SET LOCAL app.current_tenant_id = $1 persists only for the transaction duration.
// Tenant scope is enforced at the DB layer by RLS policies.
// const user = await withTenant(tenantId, async (client) => {
//   const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
//   return result.rows[0];
// });
export async function withTenant<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL app.current_tenant_id = $1", [tenantId]);

    const result = await fn(client);

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
