import { aiStatus } from "@/lib/ai/provider";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";
export const GET = () => ok(aiStatus());
