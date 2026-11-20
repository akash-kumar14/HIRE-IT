import { describe, expect, it } from "vitest";
import {
  createUser,
  normalizeEmail,
} from "@/modules/users/users.service.js";

describe("normalizeEmail", () => {
  it("trims whitespace and lowercases the address", () => {
    expect(normalizeEmail("  Person.Name@Example.COM  ")).toBe(
      "person.name@example.com",
    );
  });

  it("rejects an empty or non-string address", () => {
    expect(() => normalizeEmail("   ")).toThrow("Email is required");
    expect(() => normalizeEmail(null)).toThrow("Email must be a string");
  });
});

describe("createUser validation", () => {
  const database = {
    insert: () => {
      throw new Error("database should not be called");
    },
  };

  it("requires a password hash", async () => {
    await expect(
      createUser(
        { email: "person@example.com", passwordHash: "", fullName: "Person" },
        { database },
      ),
    ).rejects.toThrow("Password hash is required");
  });

  it("requires a full name", async () => {
    await expect(
      createUser(
        { email: "person@example.com", passwordHash: "hash", fullName: "  " },
        { database },
      ),
    ).rejects.toThrow("Full name is required");
  });
});
