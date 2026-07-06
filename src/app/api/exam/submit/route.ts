import { NextRequest } from "next/server";
import { proxy } from "../../_proxy";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  return proxy(req, `/api/exam/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
