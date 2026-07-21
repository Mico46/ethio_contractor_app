module.exports = {
  reactStrictMode: true,
  serverExternalPackages: ["firebase"],
  eslint: {
    dirs: [".", "components", "pages", "api"],
    ignoreDuringBuilds: true
  },
  images: {
    domains: ["firebasestorage.googleapis.com", "firebasestorage.googleapis.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};
