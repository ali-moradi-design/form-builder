import { getAuth, refuseSignUp } from "@/shared/auth";

const handle = async (request: Request): Promise<Response> => (await getAuth()).handler(request);

export const GET = handle;

/** Auth API. Sign-up over HTTP is refused unless public sign-up is on. */
export async function POST(request: Request): Promise<Response> {
  return refuseSignUp(request) ?? handle(request);
}
