import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
    manifest_version: 3,
    name: pkg.displayName,
    version: pkg.version,
    icons: {
        "16": "icon/16.png",
        "32": "icon/32.png",
        "48": "icon/48.png",
        "96": "icon/96.png",
        "128": "icon/128.png",
    },
    action: {
        default_popup: "src/pages/popup/index.html",
    },
    background: {
        service_worker: "src/background.ts",
        type: "module",
    },
    content_scripts: [
        {
            matches: ["https://bright.uvic.ca/*"],
            js: ["src/pages/content/index.ts"],
            run_at: "document_start",
        },
    ],
});
