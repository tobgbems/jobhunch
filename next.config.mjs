/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "thejobhunch.com", pathname: "/**" },
      { protocol: "https", hostname: "www.thejobhunch.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
