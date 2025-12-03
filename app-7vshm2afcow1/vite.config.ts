import { defineConfig, type PluginOption } from "vite";
import { miaodaDevPlugin } from "miaoda-sc-plugin";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
  base: "./",  // 🔥 The required fix

  build: {
    assetsDir: "assets",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name].[hash].[ext]",
        chunkFileNames: "assets/[name].[hash].js",
        entryFileNames: "assets/[name].[hash].js",
      },
    },
  },

  plugins: [
    react(),
    // miaodaDevPlugin() returns plugin objects with `enforce` values that are
    // typed as `string` by the package. Cast the result to PluginOption[] so
    // TypeScript accepts the plugins array according to Vite's types.
    ...(miaodaDevPlugin() as unknown as PluginOption[]),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        /192\.168\.\d{1,3}\.\d{1,3}:\d{1,5}$/,
      ],
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, PUT, PATCH, POST, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
    middlewareMode: false,
  },
});
// single canonical vite config file (no duplicate exports)
