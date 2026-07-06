import { NextRequest } from "next/server";
import { proxy } from "../../_proxy";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxy(req, `/api/questions/${encodeURIComponent(id)}`);
}
