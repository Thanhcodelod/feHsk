import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "../_proxy";

export const dynamic = "force-dynamic";

// Binary proxy for the backend TTS endpoint (returns MP3 audio). The generic
// text proxy in _proxy.ts can't carry binary bodies, so audio has its own route.
export async function GET(req: NextRequest) {
  try {
    const upstream = await fetch(
      `${BACKEND_URL}/api/tts${req.nextUrl.search}`,
      { cache: "no-store" }
    );
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "audio/mpeg",
        "Cache-Control":
          upstream.headers.get("Cache-Control") ??
          "public, max-age=604800",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối tới máy chủ phát âm (backend)." },
      { status: 502 }
    );
  }
}
