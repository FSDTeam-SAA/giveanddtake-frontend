/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        // If you want to restrict to a specific Cloudinary cloud name, set:
        // pathname: "/<YOUR_CLOUD_NAME>/**",
      },
    ],
  },
};

export default nextConfig;