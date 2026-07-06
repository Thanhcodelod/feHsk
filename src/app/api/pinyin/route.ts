import { NextRequest } from "next/server";
import { proxy } from "../_proxy";

export const dynamic = "force-dynamic";

// Pinyin → Chinese-character candidates for the virtual keyboard (IME).
export async function GET(req: NextRequest) {
  return proxy(req, `/api/pinyin${req.nextUrl.search}`);
}
