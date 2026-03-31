// app/page.tsx
"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_LARK_APP_ID;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback`);

    const scope = encodeURIComponent(
      [
        "contact:user.base:readonly",
        "contact:user.department:readonly",
        "contact:user.email:readonly",
      ].join(" ")
    );
    window.location.href = `https://open.larksuite.com/open-apis/authen/v1/authorize?app_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  }, []);

  return <p style={{ fontFamily: "sans-serif", padding: 40 }}>Redirecting to Lark...</p>;
}