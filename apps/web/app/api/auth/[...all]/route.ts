import { getAuth } from "@/shared/auth";

const handle = async (request: Request): Promise<Response> => (await getAuth()).handler(request);

export const GET = handle;
export const POST = handle;
