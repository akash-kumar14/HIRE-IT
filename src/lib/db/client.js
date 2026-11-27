import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import WebSocket from "ws";
import { ConfigError, validateEnv } from "../config/env.js";
import * as schema from "./schema/index.js";

class Ipv4NeonWebSocket extends WebSocket {
  constructor(url) {
    super(url, undefined, { family: 4 });
  }
}

neonConfig.webSocketConstructor = Ipv4NeonWebSocket;

let pool = null;
let db = null;

function getConnectionString() {
  const { errors, values } = validateEnv();
  const databaseError = errors.find((error) => error.key === "DATABASE_URL");

  if (databaseError) {
    throw new ConfigError([databaseError]);
  }

  if (!values.DATABASE_URL) {
    throw new ConfigError([{ key: "DATABASE_URL", reason: "missing" }]);
  }

  return values.DATABASE_URL;
}

export function getDb() {
  if (!db) {
    pool = new Pool({ connectionString: getConnectionString() });
    db = drizzle({ client: pool, schema });
  }

  return db;
}

export async function closeDb() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
  db = null;
}
