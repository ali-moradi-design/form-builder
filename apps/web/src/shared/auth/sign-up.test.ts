import { afterEach, describe, expect, it, vi } from "vitest";
import { refuseSignUp, signUpOpen } from "./sign-up";

const post = (path: string) => new Request(`http://x/api/auth${path}`, { method: "POST" });

describe("sign-up over HTTP", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is refused unless PUBLIC_SIGN_UP is on", () => {
    vi.stubEnv("PUBLIC_SIGN_UP", "");
    expect(signUpOpen()).toBe(false);
    expect(refuseSignUp(post("/sign-up/email"))?.status).toBe(403);
    expect(refuseSignUp(post("/sign-in/email"))).toBeNull();
  });

  it("goes on when PUBLIC_SIGN_UP is on", () => {
    vi.stubEnv("PUBLIC_SIGN_UP", "on");
    expect(refuseSignUp(post("/sign-up/email"))).toBeNull();
  });
});
