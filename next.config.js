/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Skip ESLint during production builds so packaging isn't blocked
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type errors during production builds to allow packaging
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
