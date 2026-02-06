import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/",
  preview: {
    allowedHosts: true,
  },
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        // add more pages here
      },
    },
  },
});
