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
      "@chakra-ui/react",
    ],
    exclude: ["@carefree0910/core", "@carefree0910/svg", "@emotion/react", "@chakra-ui/react"],
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
    commonjsOptions: {
      requireReturnsDefault: function (path) {
        if (path.includes("rc-upload")) return true;
        return false;
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          utils: [
            "axios",
            "jszip",
            "colord",
            "classnames",
            "ml-matrix",
            "platform",
            "uuid",
            "@lokesh.dhakar/quantize",
          ],
          opentype: ["opentype.js"],
          "chakra-ui": [
            "@emotion/react",
            "@emotion/styled",
            "@chakra-ui/react",
            "@chakra-ui/icons",
          ],
          react: ["react", "react-dom"],
          "react-colorful": ["react-colorful"],
          "react-markdown": ["react-markdown", "remark-gfm", "react-syntax-highlighter"],
          "react-select": ["react-select", "chakra-react-select"],
          mobx: ["mobx", "mobx-react-lite"],
          "rc-upload": ["rc-upload"],
          "lottie-web": ["lottie-web"],
          svgdotjs: [
            "@svgdotjs/svg.js",
            "@svgdotjs/svg.filter.js",
            "@svgdotjs/svg.topath.js",
            "@svgdotjs/svg.topoly.js",
          ],
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
