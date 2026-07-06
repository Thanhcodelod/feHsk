import { NextRequest } from "next/server";
import { proxy } from "../../_proxy";

export const dynamic = "force-dynamic";

// Handles /api/srs/states (GET) and /api/srs/review (POST).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  return proxy(req, `/api/srs/${encodeURIComponent(action)}`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const body = await req.text();
  return proxy(req, `/api/srs/${encodeURIComponent(action)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
