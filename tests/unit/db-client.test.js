import { neonConfig } from "@neondatabase/serverless";
import WS from "ws";
import { describe, expect, it } from "vitest";
import "@/lib/db/client.js";

describe("database client", () => {
  it("uses an IPv4-forced ws constructor for Neon WebSockets", () => {
    const constructor = neonConfig.webSocketConstructor;

    expect(constructor).not.toBe(WS);
    expect(WS.isPrototypeOf(constructor)).toBe(true);
  });
});
