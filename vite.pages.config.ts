import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL("./static-demo", import.meta.url)),
  base: process.env.PAGES_BASE_PATH || "/scrumptious-/",
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  define: { "import.meta.env.VITE_STATIC_DEMO": JSON.stringify("true") },
  build: { outDir: fileURLToPath(new URL("./pages-dist", import.meta.url)), emptyOutDir: true },
});
