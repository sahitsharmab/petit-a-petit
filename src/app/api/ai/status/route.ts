import { getDb } from "@/lib/db";
import { learnerAiStatus } from "@/lib/ai/learner";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";
export const GET = handle(async () => ok(await learnerAiStatus(await getDb())));
