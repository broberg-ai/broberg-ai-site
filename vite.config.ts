import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Vite only builds the small client-enhancement bundle + the CSS.
// SSR is served by the Bun/Hono server (src/server.tsx); these assets are
// emitted to dist/client and served statically by Hono in production.
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        enhance: "src/client/enhance.ts",
        styles: "src/styles/app.css",
      },
      output: {
        // Content-hashed names so a new deploy busts the cache (paired with the
        // immutable cache header); resolveAssets reads the hashed names from the
        // Vite manifest.
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
