import { describe, expect, it } from "vitest";
import {
  CatalogConflictError,
  CatalogNotFoundError,
  toPublicCategory,
  toPublicSkill,
} from "@/modules/categories/catalog.service.js";
import {
  parsePagination,
  validateCategoryCreate,
  validateCategoryUpdate,
  validateSkillCreate,
  validateSkillUpdate,
  validateUuidParam,
} from "@/modules/categories/catalog.validation.js";

const CATEGORY_ID = "6c1a2e58-9b0f-4d6a-8c3e-2f4a1b7d9e60";

describe("category validation", () => {
  it("normalizes create input and applies defaults", () => {
    expect(
      validateCategoryCreate({
        name: "  Home Repair  ",
        slug: "  Home-Repair ",
        description: " Trades ",
      }),
    ).toEqual({
      name: "Home Repair",
      slug: "home-repair",
      description: "Trades",
      sortOrder: 0,
      isActive: true,
    });
  });

  it("rejects malformed slugs and missing names", () => {
    expect(() => validateCategoryCreate({ name: "Bad", slug: "Bad_Slug" })).toThrow(
      "lowercase letters",
    );
    expect(() => validateCategoryCreate({ name: "", slug: "valid" })).toThrow(
      "Name must be between 1 and 120 characters",
    );
  });

  it("requires at least one update field and clears descriptions", () => {
    expect(() => validateCategoryUpdate({})).toThrow("At least one field");
    expect(validateCategoryUpdate({ description: null })).toEqual({
      description: null,
    });
    expect(validateCategoryUpdate({ isActive: false })).toEqual({
      isActive: false,
    });
  });
});

describe("skill validation", () => {
  it("requires a UUID category and normalizes input", () => {
    expect(
      validateSkillCreate({
        categoryId: CATEGORY_ID,
        name: " Electrician ",
        slug: "Electrician",
      }),
    ).toEqual({
      categoryId: CATEGORY_ID,
      name: "Electrician",
      slug: "electrician",
      description: null,
      isActive: true,
    });
  });

  it("rejects missing or invalid categories", () => {
    expect(() => validateSkillCreate({ categoryId: "nope" })).toThrow(
      "valid UUID",
    );
    expect(() => validateUuidParam("not-a-uuid")).toThrow("valid UUID");
  });

  it("keeps category immutable on update", () => {
    expect(validateSkillUpdate({ name: "Plumber", categoryId: CATEGORY_ID })).toEqual({
      name: "Plumber",
    });
  });
});

describe("parsePagination", () => {
  it("uses defaults and accepts numeric strings", () => {
    expect(parsePagination()).toEqual({ limit: 20, offset: 0 });
    expect(parsePagination({ limit: "5", offset: "10" })).toEqual({
      limit: 5,
      offset: 10,
    });
  });

  it("rejects negative, fractional, and oversized values", () => {
    expect(() => parsePagination({ limit: "0" })).toThrow("between 1 and 100");
    expect(() => parsePagination({ limit: "101" })).toThrow("between 1 and 100");
    expect(() => parsePagination({ offset: "-1" })).toThrow("non-negative");
    expect(() => parsePagination({ offset: "1.5" })).toThrow("non-negative");
  });
});

describe("public catalog mapping", () => {
  it("omits administrative fields", () => {
    const row = {
      id: CATEGORY_ID,
      name: "Home Repair",
      slug: "home-repair",
      description: null,
      sortOrder: 2,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(toPublicCategory(row)).toEqual({
      id: CATEGORY_ID,
      name: "Home Repair",
      slug: "home-repair",
      description: null,
      sortOrder: 2,
    });
    expect(toPublicSkill({ ...row, categoryId: CATEGORY_ID })).toEqual({
      id: CATEGORY_ID,
      categoryId: CATEGORY_ID,
      name: "Home Repair",
      slug: "home-repair",
      description: null,
    });
  });
});

describe("catalog errors", () => {
  it("exposes sanitizable status and code", () => {
    const conflict = new CatalogConflictError("CATEGORY_EXISTS", "Duplicate.");
    const missing = new CatalogNotFoundError("Category not found.");

    expect([conflict.code, conflict.status]).toEqual(["CATEGORY_EXISTS", 409]);
    expect([missing.code, missing.status]).toEqual(["NOT_FOUND", 404]);
  });
});
