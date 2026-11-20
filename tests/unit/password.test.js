import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/modules/auth/password.js";

describe("password hashing", () => {
  it("stores a bcrypt hash instead of the plaintext", async () => {
    const password = "CorrectHorseBatteryStaple123!";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toBe(password);
    expect(passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it("verifies the matching password and rejects a different one", async () => {
    const passwordHash = await hashPassword("CorrectHorseBatteryStaple123!");

    await expect(
      verifyPassword("CorrectHorseBatteryStaple123!", passwordHash),
    ).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", passwordHash)).resolves.toBe(
      false,
    );
  });

  it("uses a fresh salt for each hash", async () => {
    const first = await hashPassword("same-password");
    const second = await hashPassword("same-password");

    expect(first).not.toBe(second);
  });

  it("rejects missing inputs", async () => {
    await expect(hashPassword("")).rejects.toThrow("Password is required");
    await expect(hashPassword(undefined)).rejects.toThrow(
      "Password is required",
    );
    await expect(verifyPassword("", "stored-hash")).resolves.toBe(false);
    await expect(verifyPassword("password", "")).resolves.toBe(false);
  });
});
