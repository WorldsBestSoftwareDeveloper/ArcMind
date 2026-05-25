import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(appDir, "../.."),
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": appDir,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false
    };
    return config;
  }
};

export default nextConfig;
