import { describe, expect, it } from "vitest";
import {
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  buildApplicationPayload,
} from "@/lib/ui/provider-application-form.js";

describe("buildApplicationPayload", () => {
  it("trims fields and sends null when bio is blank", () => {
    expect(
      buildApplicationPayload({
        displayName: "  Trusted Home Care  ",
        bio: "   ",
      }),
    ).toEqual({ displayName: "Trusted Home Care", bio: null });
  });

  it("keeps a trimmed bio", () => {
    expect(
      buildApplicationPayload({
        displayName: "Agra Plumbing",
        bio: "  Registered plumber serving Agra.  ",
      }),
    ).toEqual({
      displayName: "Agra Plumbing",
      bio: "Registered plumber serving Agra.",
    });
  });

  it("rejects a blank display name", () => {
    expect(() => buildApplicationPayload({ displayName: "   " })).toThrow(
      `Display name must be between 1 and ${MAX_DISPLAY_NAME_LENGTH} characters.`,
    );
  });

  it("rejects fields longer than the API limits", () => {
    expect(() =>
      buildApplicationPayload({
        displayName: "a".repeat(MAX_DISPLAY_NAME_LENGTH + 1),
      }),
    ).toThrow("Display name must be between 1 and 120 characters.");

    expect(() =>
      buildApplicationPayload({
        displayName: "Valid Name",
        bio: "a".repeat(MAX_BIO_LENGTH + 1),
      }),
    ).toThrow("Bio must be at most 1000 characters.");
  });
});
