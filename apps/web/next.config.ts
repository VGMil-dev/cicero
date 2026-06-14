import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
        'sharp': false,
      };
    }
    return config;
  },
};

export default withSerwist(nextConfig);
