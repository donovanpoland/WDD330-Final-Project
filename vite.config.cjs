import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/",
  publicDir: "public",
  preview: {
    allowedHosts: true,
  },
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        jobs: resolve(__dirname, "src/jobs/index.html"),
        workshop: resolve(__dirname, "src/workshop/index.html"),
        // add more pages here
      },
    },
  },
});
