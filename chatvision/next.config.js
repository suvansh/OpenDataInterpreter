/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['iili.io']
  },
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Fixes npm packages (sql.js) that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }

    return config;
  },
}

module.exports = nextConfig
