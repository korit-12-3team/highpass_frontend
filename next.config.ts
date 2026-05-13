import type { NextConfig } from "next";

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const backendProxyTarget =
  process.env.BACKEND_PROXY_TARGET ??
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ??
  (/^https?:\/\//i.test(configuredApiBaseUrl ?? "") ? new URL(configuredApiBaseUrl!).origin : undefined) ??
  "https://highpass-backend-305270288811.asia-northeast3.run.app";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendProxyTarget}/:path*`,
      },
      {
        source: "/login/oauth2/code/:path*",
        destination: `${backendProxyTarget}/login/oauth2/code/:path*`,
      },
    ];
  },
};

export default nextConfig;
