// app/page.tsx
"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_LARK_APP_ID;
    const redirectUri = encodeURIComponent("https://lark-sso-app1.vercel.app/auth/callback");

    window.location.href = `https://open.larksuite.com/open-apis/authen/v1/authorize?app_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=contact:user.base:readonly`;
  }, []);

  return <p style={{ fontFamily: "sans-serif", padding: 40 }}>Redirecting to Lark...</p>;
}