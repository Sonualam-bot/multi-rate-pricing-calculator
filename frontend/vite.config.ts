import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /**
     * Mirrors production's vercel.json rewrite: requests to /api/* are
     * forwarded to the backend server-side instead of the browser hitting
     * localhost:4000 directly, so dev and prod behave the same way for
     * cookies — same-origin from the browser's perspective in both.
     */
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
