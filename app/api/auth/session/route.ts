import { handler, jsonOk } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export const GET = handler(async () => {
  const user = await getSessionUser();
  return jsonOk({ user });
});
