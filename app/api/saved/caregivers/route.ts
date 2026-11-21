import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { toggleSaved } from "@/lib/saved";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await readJson<{ id: string }>(req);
  return jsonOk(await toggleSaved(user, "caregiver", id));
});
