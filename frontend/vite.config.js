import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget = process.env.VITE_BACKEND_URL || "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/health": backendTarget,
      "/auth": backendTarget,
      "/upload": backendTarget,
      "/submission": backendTarget,
    },
  },
});