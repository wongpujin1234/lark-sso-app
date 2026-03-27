// app/api/auth/callback/route.ts
import { NextRequest } from "next/server";

const LARK_BASE = "https://open.larksuite.com/open-apis";

type UserIdType = "open_id" | "user_id" | "union_id";
type DeptIdType = "open_department_id" | "department_id";

function departmentDisplayName(dept: {
  name?: string | { zh_cn?: string; en_us?: string };
}): string {
  const n = dept?.name;
  if (!n) return "";
  if (typeof n === "string") return n;
  return n.en_us || n.zh_cn || "";
}

/** Pull department IDs from Contact user payload (field shapes vary by tenant). */
function extractDepartmentIds(user: Record<string, unknown>): string[] {
  const raw = user?.department_ids;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
  }
  const orders = user?.orders;
  if (Array.isArray(orders)) {
    const fromOrders = orders
      .map((o) => (o as { department_id?: string }).department_id)
      .filter((x): x is string => typeof x === "string" && x.length > 0);
    if (fromOrders.length > 0) return fromOrders;
  }
  return [];
}

function extractBatchItems(data: Record<string, unknown> | undefined): unknown[] {
  if (!data) return [];
  const items = data.items;
  if (Array.isArray(items)) return items;
  const userList = data.user_list;
  if (Array.isArray(userList)) return userList;
  return [];
}

async function fetchDepartmentName(
  tenantToken: string,
  userToken: string | undefined,
  departmentId: string
): Promise<string> {
  for (const idType of ["open_department_id", "department_id"] as const) {
    const url = `${LARK_BASE}/contact/v3/departments/${encodeURIComponent(departmentId)}?department_id_type=${idType}`;
    for (const token of [tenantToken, userToken].filter(Boolean) as string[]) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.code === 0 && json.data?.department) {
        const name = departmentDisplayName(json.data.department);
        if (name) return name;
      }
    }
  }
  return "";
}

/** Batch get user — Lark may return items under `items` or `user_list`. */
async function fetchDepartmentIdsViaBatch(
  authToken: string,
  openId: string,
  departmentIdType: DeptIdType
): Promise<{
  ids: string[];
  item: Record<string, unknown> | null;
  rawCode: number;
  rawMsg: string;
} | null> {
  if (!authToken || !openId) return null;
  const qs = new URLSearchParams();
  qs.append("user_ids", openId);
  qs.append("user_id_type", "open_id");
  qs.append("department_id_type", departmentIdType);
  const res = await fetch(`${LARK_BASE}/contact/v3/users/batch?${qs}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const json = (await res.json()) as {
    code?: number;
    msg?: string;
    data?: Record<string, unknown>;
  };
  const code = json.code ?? -1;
  const msg = json.msg ?? "";
  if (code !== 0) {
    console.warn("[lark-sso] batch users", { code, msg, departmentIdType });
    return null;
  }
  const items = extractBatchItems(json.data);
  if (items.length === 0) {
    console.warn("[lark-sso] batch users empty items", { msg, departmentIdType });
    return null;
  }
  const item = items[0] as Record<string, unknown>;
  const ids = extractDepartmentIds(item);
  if (ids.length === 0) {
    console.warn("[lark-sso] batch user has no department_ids/orders", {
      keys: Object.keys(item),
    });
  }
  return { ids, item, rawCode: code, rawMsg: msg };
}

async function fetchContactUser(
  authToken: string,
  userId: string,
  userIdType: UserIdType,
  departmentIdType: DeptIdType
): Promise<Record<string, unknown> | null> {
  if (!authToken || !userId) return null;
  const url = `${LARK_BASE}/contact/v3/users/${encodeURIComponent(userId)}?user_id_type=${userIdType}&department_id_type=${departmentIdType}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const json = await res.json();
  if (json.code !== 0 || !json.data?.user) {
    if (json.code !== 0) {
      console.warn("[lark-sso] get user", {
        code: json.code,
        msg: json.msg,
        userIdType,
        departmentIdType,
      });
    }
    return null;
  }
  return json.data.user as Record<string, unknown>;
}

async function resolveDepartmentNames(
  tenantToken: string,
  userToken: string | undefined,
  deptIds: string[]
): Promise<string> {
  const names: string[] = [];
  for (const deptId of deptIds) {
    const n = await fetchDepartmentName(tenantToken, userToken, deptId);
    if (n) names.push(n);
  }
  if (names.length > 0) return names.join(", ");
  // Name lookup failed (still useful to show IDs for debugging / partial visibility)
  return deptIds.join(", ");
}

async function fetchContactExtras(
  tenantToken: string,
  userAccessToken: string | undefined,
  oidcUser: {
    open_id?: string;
    user_id?: string;
    union_id?: string;
  }
): Promise<{
  department: string;
  contactUser: Record<string, unknown> | null;
}> {
  if (!tenantToken) return { department: "", contactUser: null };

  const openId = oidcUser.open_id ?? "";
  const tokens = [userAccessToken, tenantToken].filter(Boolean) as string[];

  let contactUser: Record<string, unknown> | null = null;

  // 1) Batch API (user token first)
  for (const token of tokens) {
    for (const deptType of ["open_department_id", "department_id"] as const) {
      const batch = await fetchDepartmentIdsViaBatch(token, openId, deptType);
      if (batch?.item) contactUser = batch.item;
      if (batch?.ids.length) {
        const label = await resolveDepartmentNames(
          tenantToken,
          userAccessToken,
          batch.ids
        );
        if (label) {
          return {
            department: label,
            contactUser: batch.item ?? contactUser,
          };
        }
      }
    }
  }

  // 2) Single-user GET
  const attempts: Array<{ id: string; userIdType: UserIdType }> = [];
  if (openId) attempts.push({ id: openId, userIdType: "open_id" });
  if (oidcUser.user_id) {
    attempts.push({ id: oidcUser.user_id, userIdType: "user_id" });
  }
  if (oidcUser.union_id) {
    attempts.push({ id: oidcUser.union_id, userIdType: "union_id" });
  }

  let deptIds: string[] = [];
  outer: for (const token of tokens) {
    for (const { id, userIdType } of attempts) {
      for (const deptType of ["open_department_id", "department_id"] as const) {
        const u = await fetchContactUser(token, id, userIdType, deptType);
        if (!u) continue;
        contactUser = u;
        deptIds = extractDepartmentIds(u);
        if (deptIds.length > 0) break outer;
      }
    }
  }

  if (deptIds.length === 0) {
    return { department: "", contactUser };
  }
  const department = await resolveDepartmentNames(
    tenantToken,
    userAccessToken,
    deptIds
  );
  return { department, contactUser };
}

/** Prefer OIDC employee_no; else Contact `employee_no` when present. */
function pickEmployeeNo(
  oidcEmployeeNo: string | undefined,
  contactUser: Record<string, unknown> | null
): string {
  if (oidcEmployeeNo?.trim()) return oidcEmployeeNo.trim();
  const fromContact = contactUser?.employee_no;
  if (typeof fromContact === "string" && fromContact.trim()) {
    return fromContact.trim();
  }
  return "";
}

function resolveBaseUrl(requestUrl: string): string {
  const redirectUri = process.env.REDIRECT_URI;
  if (redirectUri) {
    try {
      return new URL(redirectUri).origin;
    } catch {
      // Fall through to request origin if REDIRECT_URI is malformed.
    }
  }
  return new URL(requestUrl).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  // 1. Get tenant access token
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
  const tokenData = await tokenRes.json();
  const appToken = tokenData.tenant_access_token as string | undefined;

  // 2. Exchange code for user access token
  const userTokenRes = await fetch(`${LARK_BASE}/authen/v1/oidc/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appToken}`,
    },
    body: JSON.stringify({ grant_type: "authorization_code", code }),
  });
  const userTokenData = await userTokenRes.json();
  const userAccessToken = userTokenData.data?.access_token as
    | string
    | undefined;

  if (!userAccessToken) {
    return new Response(JSON.stringify(userTokenData), { status: 401 });
  }

  // 3. Fetch user info (OIDC)
  const userInfoRes = await fetch(`${LARK_BASE}/authen/v1/user_info`, {
    headers: { Authorization: `Bearer ${userAccessToken}` },
  });
  const userInfo = await userInfoRes.json();
  const user = userInfo.data;

  const oidcIds = {
    open_id: user?.open_id as string | undefined,
    user_id: user?.user_id as string | undefined,
    union_id: user?.union_id as string | undefined,
  };

  // 4. Department + Contact user row (employee_no, etc.)
  const { department, contactUser } = await fetchContactExtras(
    appToken ?? "",
    userAccessToken,
    oidcIds
  );
  const employeeId = pickEmployeeNo(
    user?.employee_no as string | undefined,
    contactUser
  );

  // 5. Redirect to welcome page
  const params = new URLSearchParams({
    name: user?.name || "",
    en_name: user?.en_name || "",
    user_id: user?.user_id || "",
    open_id: user?.open_id || "",
    employee_id: employeeId,
    email: user?.email || "",
    avatar: user?.avatar_url || "",
    department,
  });

  const baseUrl = resolveBaseUrl(request.url);
  return Response.redirect(`${baseUrl}/welcome?${params}`);
}
