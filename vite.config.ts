import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig(({ mode }) => {
  // Load environment variables (available for future use)
  void loadEnv(mode, ".", "");
  return {
    server: {
      port: 3101,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
        strategy: ["localStorage", "globalVariable", "baseLocale"],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      // Code splitting for optimal loading
      rollupOptions: {
        output: {
          manualChunks: {
            // React core - loaded first
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            // Animation libraries
            "animation": ["framer-motion", "lenis"],
            // 3D rendering - heavy, load on demand
            "three": ["three", "@react-three/fiber", "@react-three/drei"],
            // Supabase client
            "supabase": ["@supabase/supabase-js"],
            // Admin dashboard - only for admins
            "admin": [
              "@refinedev/core",
              "@refinedev/supabase",
              "@refinedev/react-router",
            ],
          },
        },
      },
      // Increase chunk size warning threshold (300kb)
      chunkSizeWarningLimit: 300,
      // Source maps for production debugging
      sourcemap: mode === "development",
      // Minification
      minify: mode === "production" ? "esbuild" : false,
    },
  };
});
