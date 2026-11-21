import "dotenv/config";
import { closeDb } from "../src/lib/db/client.js";
import { bootstrapInitialSuperAdmin } from "../src/modules/admin/admin.service.js";

async function main() {
  if (process.env.ADMIN_BOOTSTRAP_CONFIRM !== "1") {
    throw new Error("Set ADMIN_BOOTSTRAP_CONFIRM=1 to run the bootstrap.");
  }

  const email = process.env.ADMIN_EMAIL;

  if (!email) {
    throw new Error("Set ADMIN_EMAIL to an existing verified user.");
  }

  const profile = await bootstrapInitialSuperAdmin({ email });
  process.stdout.write(`Bootstrapped super admin profile ${profile.id}.\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
