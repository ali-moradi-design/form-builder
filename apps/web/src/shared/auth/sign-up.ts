/**
 * Whether anyone may create an account (`PUBLIC_SIGN_UP=on`). Off by
 * default: the public site offers only the demo account, so strangers can't
 * publish forms (for example phishing pages) under our domain.
 */
export const signUpOpen = (): boolean => process.env.PUBLIC_SIGN_UP === "on";

/** A refusal for an HTTP sign-up while sign-up is closed, or `null` to go on. */
export function refuseSignUp(request: Request): Response | null {
  if (signUpOpen() || !new URL(request.url).pathname.includes("/sign-up/")) return null;
  return Response.json({ message: "Sign-up is closed." }, { status: 403 });
}
