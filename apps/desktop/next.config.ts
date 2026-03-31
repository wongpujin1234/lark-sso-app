import path from "path";
import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@lark-sso/auth", "@lark-sso/ui", "@lark-sso/device"],
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
