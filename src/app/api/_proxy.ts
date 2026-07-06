// Shared helper for the Next.js API route handlers that proxy to the Express
// backend (behsk). Runs server-side only. Forwards the caller's Authorization
// header so the backend can attribute requests to the logged-in account.
import { NextResponse } from "next/server";

export const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function proxy(
  req: Request,
  path: string,
  init?: RequestInit
): Promise<NextResponse> {
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
    const text = await res.text();
    const outHeaders: Record<string, string> = {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    };
    // Forward upstream caching directives so the browser can cache static
    // content (vocab/patterns/radicals/translations) across navigations.
    const cacheControl = res.headers.get("Cache-Control");
    if (cacheControl) outHeaders["Cache-Control"] = cacheControl;
    return new NextResponse(text, { status: res.status, headers: outHeaders });
  } catch {
    return NextResponse.json(
      {
        error:
          "Không thể kết nối tới máy chủ (backend). Hãy chắc chắn backend đang chạy ở " +
          BACKEND_URL +
          " (cd behsk && npm run dev).",
      },
      { status: 502 }
    );
  }
}
