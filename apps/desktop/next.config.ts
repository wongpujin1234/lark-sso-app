import path from "path";
import type { NextConfig } from "next";
const repoRoot = path.resolve(process.cwd(), "..", "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@lark-sso/auth", "@lark-sso/ui"],
  /** Include monorepo `packages/*` in serverless traces (Vercel). */
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
