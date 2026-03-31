import { handleLarkOAuthCallback } from "@lark-sso/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }
  return handleLarkOAuthCallback(request.url, code);
}
