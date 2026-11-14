import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  /**
   * Mobile app + ASC metadata use short paths from `apps/mobile/constants/legal.ts`.
   * Canonical public pages live under longer names; keep both reachable (GitHub #312).
   */
  async redirects() {
    return [
      {
        source: '/refund-policy',
        destination: '/refund-and-cancellation-policy',
        permanent: true,
      },
      {
        source: '/account-deletion',
        destination: '/delete-account',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        source: "/sessions/:path*",
        headers: [
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
