// Secret-protected debug: compare batch vs single Contact API responses.
// Set LARK_DEBUG_SECRET in Vercel env, then:
// GET /api/debug/lark-contact?secret=YOUR_SECRET&open_id=ou_xxx
import { NextRequest } from "next/server";

const LARK_BASE = "https://open.larksuite.com/open-apis";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const openId = searchParams.get("open_id");

  if (!process.env.LARK_DEBUG_SECRET || secret !== process.env.LARK_DEBUG_SECRET) {
    return new Response("Not found", { status: 404 });
  }
  if (!openId?.trim()) {
    return Response.json(
      { error: "Missing open_id query param" },
      { status: 400 }
    );
  }

  const tokenRes = await fetch(
    `${LARK_BASE}/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: process.env.LARK_APP_ID,
        app_secret: process.env.LARK_APP_SECRET,
      }),
    }
  );
  const tokenJson = await tokenRes.json();
  const tenantToken = tokenJson.tenant_access_token as string | undefined;
  if (!tenantToken) {
    return Response.json({ error: "tenant token", tokenJson }, { status: 500 });
  }

  const qs = new URLSearchParams();
  qs.append("user_ids", openId);
  qs.append("user_id_type", "open_id");
  qs.append("department_id_type", "open_department_id");

  const batchRes = await fetch(
    `${LARK_BASE}/contact/v3/users/batch?${qs}`,
    { headers: { Authorization: `Bearer ${tenantToken}` } }
  );
  const batchJson = await batchRes.json();

  const singleRes = await fetch(
    `${LARK_BASE}/contact/v3/users/${encodeURIComponent(openId)}?user_id_type=open_id&department_id_type=open_department_id`,
    { headers: { Authorization: `Bearer ${tenantToken}` } }
  );
  const singleJson = await singleRes.json();

  return Response.json({
    batch: batchJson,
    single: singleJson,
    hint: "If code is 41050 or items empty, check Permissions > Contacts range and contact:contact:* scopes in Lark console.",
  });
}
