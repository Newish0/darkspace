import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateManifest() {
    const manifest = readJsonFile("src/manifest.json");
    const pkg = readJsonFile("package.json");
    return {
        name: pkg.name,
        description: pkg.description,
        version: pkg.version,
        ...manifest,
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        solidPlugin(),
        webExtension({
            manifest: generateManifest,
        }),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
            "~": resolve(__dirname, "./src"),
        },
    },
    server: {},
});
