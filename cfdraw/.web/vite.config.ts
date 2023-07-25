import { defineConfig } from "vite";
import path from "path";
import svgr from "vite-plugin-svgr";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
// import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
    dedupe: ["@emotion/react"],
  },
  plugins: [
    react(),
    tsconfigPaths(),
    svgr({
      svgrOptions: {
        // svgr options
      },
    }),
    // visualizer({
    //   template: "treemap", // or sunburst
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true,
    //   filename: "analyze.html",
    // }),
  ],
  optimizeDeps: {
    include: [
      "@carefree0910/core",
      "@carefree0910/svg",
      "@carefree0910/business",
      "@carefree0910/native",
      "@carefree0910/components",
      "@emotion/react",
    ],
    exclude: ["@carefree0910/core", "@carefree0910/svg", "@emotion/react"],
    esbuildOptions: {
      keepNames: true,
    },
  },
  server: {
    port: parseInt(process.env.CFDRAW_FE_PORT || "5173"),
  },
  preview: {
    port: parseInt(process.env.CFDRAW_FE_PORT || "5173"),
  },
  esbuild: {
    keepNames: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          axios: ["axios"],
          jszip: ["jszip"],
          react: ["react", "react-dom"],
          "chakra-ui": [
            "@emotion/react",
            "@emotion/styled",
            "@chakra-ui/react",
            "@chakra-ui/icons",
          ],
          svgdotjs: [
            "@svgdotjs/svg.js",
            "@svgdotjs/svg.filter.js",
            "@svgdotjs/svg.topath.js",
            "@svgdotjs/svg.topoly.js",
          ],
          "lottie-web": ["lottie-web"],
          "react-colorful": ["react-colorful"],
          "chakra-react-select": ["chakra-react-select"],
          "react-markdown": ["react-markdown", "remark-gfm", "react-syntax-highlighter"],
          "@carefree0910/core": ["@carefree0910/core"],
          "@carefree0910/svg": ["@carefree0910/svg"],
          "@carefree0910/business": ["@carefree0910/business"],
          "@carefree0910/native": ["@carefree0910/native"],
          "@carefree0910/components": ["@carefree0910/components"],
        },
      },
    },
  },
});
