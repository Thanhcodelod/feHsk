import { NextRequest } from "next/server";
import { proxy } from "../../_proxy";

export const dynamic = "force-dynamic";

// Handles /api/auth/register, /api/auth/login (POST) and /api/auth/me (GET).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const body = await req.text();
  return proxy(req, `/api/auth/${encodeURIComponent(action)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  return proxy(req, `/api/auth/${encodeURIComponent(action)}`);
}
