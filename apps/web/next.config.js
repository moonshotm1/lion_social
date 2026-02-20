/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lion/ui", "@lion/types", "@lion/api", "@lion/database"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
