import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.js"],
    globals: true,
    css: true,
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000",
      },
    },
  },
});
