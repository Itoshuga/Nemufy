import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { hasTrustedOrigin } from "../../src/lib/http/origin";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }
});

describe("hasTrustedOrigin", () => {
  test("accepts a request from its direct public origin", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;

    const request = new Request("https://nemufy.netlify.app/api/auth/session", {
      headers: { origin: "https://nemufy.netlify.app" },
    });

    assert.equal(hasTrustedOrigin(request), true);
  });

  test("accepts the public origin forwarded by Netlify", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;

    const request = new Request("http://localhost:3000/api/auth/session", {
      headers: {
        origin: "https://nemufy.netlify.app",
        "x-forwarded-host": "nemufy.netlify.app",
        "x-forwarded-proto": "https",
      },
    });

    assert.equal(hasTrustedOrigin(request), true);
  });

  test("accepts the configured canonical origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.nemufy.com";

    const request = new Request("http://localhost:3000/api/auth/session", {
      headers: { origin: "https://app.nemufy.com" },
    });

    assert.equal(hasTrustedOrigin(request), true);
  });

  test("rejects a different origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.nemufy.com";

    const request = new Request("https://nemufy.netlify.app/api/auth/session", {
      headers: { origin: "https://attacker.example" },
    });

    assert.equal(hasTrustedOrigin(request), false);
  });

  test("rejects a request without an origin header", () => {
    const request = new Request(
      "https://nemufy.netlify.app/api/auth/session",
    );

    assert.equal(hasTrustedOrigin(request), false);
  });
});
