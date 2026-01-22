import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Replit ke liye best setting
    port: 5000,      // Port 5000 rakha hai
    watch: {
      usePolling: true, // <--- Ye line Replit ka 'ENOSPC' error fix karegi
    },
    hmr: {
      overlay: false, // Error overlay ko off rakha hai taaki choti warnings pareshan na karein
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));