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
    plugins: [
        solidPlugin(),
        crx({ manifest: transformedManifest }),
        {
            name: "add-data-darkspace-attribute",
            transform(code, id) {
                if (id.endsWith(".jsx") || id.endsWith(".tsx")) {
                    // Add data-darkspace to elements during build
                    return {
                        code: code.replace(
                            /<([a-z][a-zA-Z0-9]*)(?=[\s>])/g,
                            '<$1 data-darkspace=""'
                        ),
                        map: null,
                    };
                }
            },
        },
    ],

    define: {
        __APP_ENV__: {
            VERSION: `${pkg.version}`,
        },
    },

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

    build: {
        target: "es2022",
    },
});
