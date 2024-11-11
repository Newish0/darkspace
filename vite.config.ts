import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { crx, ManifestV3Export } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.json";
import pkg from "./package.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const transformedManifest: ManifestV3Export = {
    ...(manifest as any),
    name: pkg.displayName,
    version: pkg.version,
};

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [solidPlugin(), crx({ manifest: transformedManifest })],

    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173,
        },
    },

    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
            "~": resolve(__dirname, "./src"),
        },
    },
});
