import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("database integration", () => {
  it("connects with DATABASE_URL", async () => {
    const sql = neon(databaseUrl);
    const rows = await sql.query("select 1 as ok");

    expect(rows).toEqual([{ ok: 1 }]);
  });
});
