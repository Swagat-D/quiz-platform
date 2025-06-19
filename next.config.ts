import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'platform-lookaside.fbsbx.com',
      'pbs.twimg.com',
      'localhost',
    ],
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Ignores TS build errors
  },
  webpack(config) {
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
