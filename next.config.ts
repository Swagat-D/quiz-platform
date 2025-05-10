/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',  // For Google profile images
      'avatars.githubusercontent.com',  // For GitHub profile images
      'platform-lookaside.fbsbx.com', // For Facebook profile images
      'pbs.twimg.com',  // For Twitter profile images
      'localhost'  // For local testing
    ],
  },
  // Enable SVG optimization
  webpack(config: import('webpack').Configuration) {
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
}

module.exports = nextConfig