import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    svgr({
      svgrOptions: {
        // svgr options
      },
    }),
  ],
  optimizeDeps: {
    include: ["@noli/core", "@noli/business"],
    esbuildOptions: {
      keepNames: true,
    },
  },
  server: {
    port: parseInt(process.env.CFDRAW_FE_PORT || "5173"),
  },
});
